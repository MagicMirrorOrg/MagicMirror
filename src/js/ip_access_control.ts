import ipaddr from "ipaddr.js";
import Log from "logger";

/**
 * Checks if a client IP matches any entry in the whitelist
 * @param {string} clientIp - The IP address to check
 * @param {string[]} whitelist - Array of IP addresses or CIDR ranges
 * @returns {boolean} True if IP is allowed
 */
function isAllowed (clientIp: string, whitelist: string[]): boolean {
	try {
		const addr = ipaddr.process(clientIp);

		return whitelist.some((entry: string) => {
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
 * Creates an Express middleware for IP whitelisting
 * @param {string[]} whitelist - Array of allowed IP addresses or CIDR ranges
 * @returns {import("express").RequestHandler} Express middleware function
 */
export function ipAccessControl (whitelist: string[]) {
	// Empty whitelist means allow all
	if (!Array.isArray(whitelist) || whitelist.length === 0) {
		return function (req: any, res: any, next: any) {
			res.header("Access-Control-Allow-Origin", "*");
			next();
		};
	}

	return function (req: any, res: any, next: any) {
		const clientIp = req.ip || req.socket.remoteAddress;

		if (isAllowed(clientIp, whitelist)) {
			res.header("Access-Control-Allow-Origin", "*");
			next();
		} else {
			Log.log(`IP ${clientIp} is not allowed to access the mirror`);
			res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
		}
	};
}
