const ipaddr = require("ipaddr.js");
const Log = require("logger");

/**
 * Checks if a client IP matches any entry in the whitelist
 * @param {string} clientIp - The IP address to check
 * @param {string[]} whitelist - Array of IP addresses or CIDR ranges
 * @returns {boolean} True if IP is allowed
 */
const isIpInList = (clientIp, whitelist) => {
	try {
		const addr = ipaddr.process(clientIp);

		return whitelist.some((entry) => {
			try {
				// CIDR notation
				if (entry.includes("/")) {
					const [rangeAddr, prefixLen] = ipaddr.parseCIDR(entry);
					return addr.match(rangeAddr, prefixLen);
				}

				// Single IP address - let ipaddr.process normalize both
				const allowedAddr = ipaddr.process(entry);
				return addr.toString() === allowedAddr.toString();
			} catch {
				Log.warn(`Invalid whitelist entry: ${entry}`);
				return false;
			}
		});
	} catch {
		Log.warn(`Failed to parse client IP: ${clientIp}`);
		return false;
	}
};

/**
 * Resolves a client IP for both Express and Socket.IO requests.
 * X-Forwarded-For is client-supplied and therefore ignored by default. It is only trusted when the
 * direct peer itself is a configured trusted proxy; the resolved IP is then the last entry in the
 * chain that is not a trusted proxy (the real client), since trusted proxies append to the right.
 * Falls back to the direct peer IP when the peer is not a trusted proxy. Returns undefined when a
 * trusted proxy does not provide a usable client IP.
 * @param {object} req - Incoming request object (Express request or Socket.IO handshake request)
 * @param {string[]} [trustedProxies] - IP addresses/CIDR ranges of reverse proxies allowed to set X-Forwarded-For
 * @returns {string|undefined} The resolved client IP address, or undefined if the peer address is unavailable
 */
const resolveClientIp = (req, trustedProxies = []) => {
	const directIp = req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip;

	const peerIsTrustedProxy = Array.isArray(trustedProxies) && trustedProxies.length > 0 && isIpInList(directIp, trustedProxies);
	if (!peerIsTrustedProxy) {
		return directIp;
	}

	const forwardedFor = req.headers?.["x-forwarded-for"];
	if (typeof forwardedFor !== "string") {
		return directIp;
	}

	// The trusted proxy appends to the right, so the last non-proxy entry is the real client.
	const forwardedIps = forwardedFor.split(",").map((entry) => entry.trim());
	const clientIp = forwardedIps.findLast((ip) => ip && !isIpInList(ip, trustedProxies));

	return clientIp;
};

/**
 * Checks whether a browser Origin matches the host serving the mirror.
 * Non-browser clients (Electron clientonly, curl, node_helpers) send no Origin and are allowed.
 * @param {object} req - Incoming request object
 * @returns {boolean} True if the origin is same-host or absent
 */
const isSameOrigin = (req) => {
	const origin = req.headers?.origin;
	if (!origin) return true;

	const host = req.headers?.host;
	if (!host) return false;

	try {
		return new URL(origin).host === new URL(`http://${host}`).host;
	} catch {
		return false;
	}
};

/**
 * Determines why a request is denied, or null if it is allowed.
 * Enforces same-origin first (CSRF protection), then the optional IP whitelist.
 * @param {object} req - Incoming Express or Socket.IO request
 * @param {string[]} whitelist - Array of allowed IP addresses or CIDR ranges (empty = any IP)
 * @param {string[]} [trustedProxies] - IP addresses/CIDR ranges of reverse proxies allowed to set X-Forwarded-For
 * @returns {string|null} A human-readable denial reason, or null when allowed
 */
const accessDenialReason = (req, whitelist, trustedProxies) => {
	// Strip control characters from the attacker-controlled Origin header before logging it
	if (!isSameOrigin(req)) return `Origin ${String(req.headers?.origin).replace(/[\r\n]/g, "")} is not allowed`;

	if (Array.isArray(whitelist) && whitelist.length > 0) {
		const clientIp = resolveClientIp(req, trustedProxies);
		if (!clientIp) {
			Log.warn("Could not determine client IP from trusted proxy headers");
			return "Client IP could not be determined";
		}
		if (!isIpInList(clientIp, whitelist)) return `IP ${clientIp} is not allowed`;
	}

	return null;
};

/**
 * Creates an Express middleware enforcing same-origin and the IP whitelist.
 * @param {string[]} whitelist - Array of allowed IP addresses or CIDR ranges
 * @param {string[]} [trustedProxies] - IP addresses/CIDR ranges of reverse proxies allowed to set X-Forwarded-For
 * @returns {import("express").RequestHandler} Express middleware function
 */
const ipAccessControl = (whitelist, trustedProxies) => {
	return (req, res, next) => {
		const reason = accessDenialReason(req, whitelist, trustedProxies);
		if (!reason) return next();

		Log.warn(`${reason} to access the mirror`);
		res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
	};
};

/**
 * Creates a Socket.IO `allowRequest` handler enforcing the same rules as the HTTP middleware.
 * @param {string[]} whitelist - Array of allowed IP addresses or CIDR ranges
 * @param {string[]} [trustedProxies] - IP addresses/CIDR ranges of reverse proxies allowed to set X-Forwarded-For
 * @returns {(req: object, callback: (err: string | null, success: boolean) => void) => void} Socket.IO allowRequest handler
 */
const socketIpAccessControl = (whitelist, trustedProxies) => {
	return (req, callback) => {
		const reason = accessDenialReason(req, whitelist, trustedProxies);
		if (!reason) return callback(null, true);

		Log.warn(`${reason} to connect to the mirror socket`);
		callback("This device is not allowed to access your mirror.", false);
	};
};

module.exports = { ipAccessControl, socketIpAccessControl };
