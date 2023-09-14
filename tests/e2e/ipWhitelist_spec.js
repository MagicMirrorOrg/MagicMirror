const helpers = require("./helpers/global-setup");

describe("ipWhitelist directive configuration", () => {
	describe("Set ipWhitelist without access", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/noIpWhiteList.js");
		});
		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should return 403", async () => {
			const res = await fetch("http://localhost:8181");
			expect(res.status).toBe(403);
		});
	});

	describe("Set ipWhitelist []", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/empty_ipWhiteList.js");
		});
		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should return 200", async () => {
			const res = await fetch("http://localhost:8282");
			expect(res.status).toBe(200);
		});
	});
});
