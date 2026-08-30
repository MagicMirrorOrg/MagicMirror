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
 * Creates an Express middleware for IP whitelisting
 * @param {string[]} whitelist - Array of allowed IP addresses or CIDR ranges
 * @returns {import("express").RequestHandler} Express middleware function
 */
function ipAccessControl (whitelist) {
	// Empty whitelist means allow all
	if (!Array.isArray(whitelist) || whitelist.length === 0) {
		return function (req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			next();
		};
	}

	return function (req, res, next) {
		const clientIp = resolveClientIp(req);

		if (isAllowed(clientIp, whitelist)) {
			res.header("Access-Control-Allow-Origin", "*");
			next();
		} else {
			Log.warn(`IP ${clientIp} is not allowed to access the mirror`);
			res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
		}
	};
}

/**
 * Creates a Socket.IO `allowRequest` handler that enforces the same IP whitelist as the HTTP middleware.
 * This closes the gap where Socket.IO handshakes bypassed the Express-only `ipAccessControl` middleware.
 * @param {string[]} whitelist - Array of allowed IP addresses or CIDR ranges
 * @returns {(req: object, callback: (err: string | null, success: boolean) => void) => void} Socket.IO allowRequest handler
 */
function socketIpAccessControl (whitelist) {
	// Empty whitelist means allow all
	if (!Array.isArray(whitelist) || whitelist.length === 0) {
		return function (req, callback) {
			callback(null, true); // allow the connection
		};
	}

	return function (req, callback) {
		const clientIp = resolveClientIp(req);
		if (isAllowed(clientIp, whitelist)) {
			callback(null, true); // allow the connection
		} else {
			Log.warn(`IP ${clientIp} is not allowed to connect to the mirror socket`);
			callback("This device is not allowed to access your mirror.", false);
		}
	};
}

module.exports = { ipAccessControl, socketIpAccessControl };
