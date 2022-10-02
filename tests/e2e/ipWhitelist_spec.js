const helpers = require("./global-setup");

describe("ipWhitelist directive configuration", () => {
	describe("Set ipWhitelist without access", () => {
		beforeAll(() => {
			helpers.startApplication("tests/configs/noIpWhiteList.js");
		});
		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should return 403", (done) => {
			helpers.fetch(done, "http://localhost:8080").then((res) => {
				expect(res.status).toBe(403);
			});
		});
	});

	describe("Set ipWhitelist []", () => {
		beforeAll(() => {
			helpers.startApplication("tests/configs/empty_ipWhiteList.js");
		});
		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should return 200", (done) => {
			helpers.fetch(done, "http://localhost:8080").then((res) => {
				expect(res.status).toBe(200);
			});
		});
	});
});
