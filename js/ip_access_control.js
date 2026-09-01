const ipaddr = require("ipaddr.js");
const Log = require("logger");

/**
 * Checks if a client IP matches any entry in the whitelist
 * @param {string} clientIp - The IP address to check
 * @param {string[]} whitelist - Array of IP addresses or CIDR ranges
 * @returns {boolean} True if IP is allowed
 */
function isAllowed (clientIp, whitelist) {
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
}

/**
 * Resolves a client IP for both Express and Socket.IO requests.
 * If the direct peer is loopback, trust the first X-Forwarded-For value (local reverse proxy case).
 * Otherwise ignore X-Forwarded-For to prevent spoofing.
 * @param {object} req - Incoming request object (Express request or Socket.IO handshake request)
 * @returns {string} The resolved client IP address
 */
function resolveClientIp (req) {
	const directIp = req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip;
	const LOOPBACK_WHITELIST = ["127.0.0.1", "::ffff:127.0.0.1", "::1"];

	if (isAllowed(directIp, LOOPBACK_WHITELIST)) {
		const forwardedFor = req.headers?.["x-forwarded-for"];
		if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
			return forwardedFor.split(",")[0].trim();
		}
	}

	return directIp;
}

/**
 * Checks whether a browser Origin matches the host serving the mirror.
 * Non-browser clients (Electron clientonly, curl, node_helpers) send no Origin and are allowed.
 * @param {object} req - Incoming request object
 * @returns {boolean} True if the origin is same-host or absent
 */
function isSameOrigin (req) {
	const origin = req.headers?.origin;
	if (!origin) return true;

	const host = req.headers?.host;
	if (!host) return false;

	try {
		return new URL(origin).host === new URL(`http://${host}`).host;
	} catch {
		return false;
	}
}

/**
 * Determines why a request is denied, or null if it is allowed.
 * Enforces same-origin first (CSRF protection), then the optional IP whitelist.
 * @param {object} req - Incoming Express or Socket.IO request
 * @param {string[]} whitelist - Array of allowed IP addresses or CIDR ranges (empty = any IP)
 * @returns {string|null} A human-readable denial reason, or null when allowed
 */
function accessDenialReason (req, whitelist) {
	// Strip control characters from the attacker-controlled Origin header before logging it
	if (!isSameOrigin(req)) return `Origin ${String(req.headers?.origin).replace(/[\r\n]/g, "")} is not allowed`;

	if (Array.isArray(whitelist) && whitelist.length > 0) {
		const clientIp = resolveClientIp(req);
		if (!isAllowed(clientIp, whitelist)) return `IP ${clientIp} is not allowed`;
	}

	return null;
}

/**
 * Creates an Express middleware enforcing same-origin and the IP whitelist.
 * @param {string[]} whitelist - Array of allowed IP addresses or CIDR ranges
 * @returns {import("express").RequestHandler} Express middleware function
 */
function ipAccessControl (whitelist) {
	return (req, res, next) => {
		const reason = accessDenialReason(req, whitelist);
		if (!reason) return next();

		Log.warn(`${reason} to access the mirror`);
		res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
	};
}

/**
 * Creates a Socket.IO `allowRequest` handler enforcing the same rules as the HTTP middleware.
 * @param {string[]} whitelist - Array of allowed IP addresses or CIDR ranges
 * @returns {(req: object, callback: (err: string | null, success: boolean) => void) => void} Socket.IO allowRequest handler
 */
function socketIpAccessControl (whitelist) {
	return (req, callback) => {
		const reason = accessDenialReason(req, whitelist);
		if (!reason) return callback(null, true);

		Log.warn(`${reason} to connect to the mirror socket`);
		callback("This device is not allowed to access your mirror.", false);
	};
}

module.exports = { ipAccessControl, socketIpAccessControl };
