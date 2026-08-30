import { describe, expect, it, vi } from "vitest";

import { ipAccessControl, socketIpAccessControl } from "../../../js/ip_access_control";

/**
 * Creates a minimal Express-like response mock used by the middleware tests.
 * @returns {{ header: ReturnType<typeof vi.fn>, status: ReturnType<typeof vi.fn>, send: ReturnType<typeof vi.fn> }} Mock response object.
 */
function createResponseMock () {
	return {
		header: vi.fn(),
		status: vi.fn(function () {
			return this;
		}),
		send: vi.fn()
	};
}

describe("ip_access_control", () => {
	describe("ipAccessControl", () => {
		it("trusts first X-Forwarded-For entry when direct peer is loopback", () => {
			const middleware = ipAccessControl(["203.0.113.10"]);
			const req = {
				socket: { remoteAddress: "127.0.0.1" },
				headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.2" }
			};
			const res = createResponseMock();
			const next = vi.fn();

			middleware(req, res, next);

			expect(next).toHaveBeenCalledOnce();
			expect(res.status).not.toHaveBeenCalled();
		});

		it("ignores X-Forwarded-For when direct peer is not loopback", () => {
			const middleware = ipAccessControl(["203.0.113.10"]);
			const req = {
				socket: { remoteAddress: "198.51.100.7" },
				headers: { "x-forwarded-for": "203.0.113.10" }
			};
			const res = createResponseMock();
			const next = vi.fn();

			middleware(req, res, next);

			expect(next).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(403);
		});
	});

	describe("socketIpAccessControl", () => {
		it("accepts socket handshake using forwarded client IP when direct peer is loopback", () => {
			const allowRequest = socketIpAccessControl(["203.0.113.10"]);
			const req = {
				socket: { remoteAddress: "::1" },
				headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.2" }
			};
			const callback = vi.fn();

			allowRequest(req, callback);

			expect(callback).toHaveBeenCalledWith(null, true);
		});

		it("rejects socket handshake when only forwarded IP matches whitelist", () => {
			const allowRequest = socketIpAccessControl(["203.0.113.10"]);
			const req = {
				socket: { remoteAddress: "198.51.100.7" },
				headers: { "x-forwarded-for": "203.0.113.10" }
			};
			const callback = vi.fn();

			allowRequest(req, callback);

			expect(callback).toHaveBeenCalledWith("This device is not allowed to access your mirror.", false);
		});
	});
});
