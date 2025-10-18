const helpers = require("./helpers/global-setup");

describe("ipWhitelist directive configuration", () => {
	describe("When IP is not in whitelist", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/noIpWhiteList.js");
		});
		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should reject request with 403 (Forbidden)", async () => {
			const res = await fetch("http://localhost:8181");
			expect(res.status).toBe(403);
		});
	});

	describe("When whitelist is empty (allow all IPs)", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/empty_ipWhiteList.js");
		});
		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should allow request with 200 (OK)", async () => {
			const res = await fetch("http://localhost:8282");
			expect(res.status).toBe(200);
		});
	});
});
