const helpers = require("./global-setup");

describe("ipWhitelist directive configuration", function () {
	describe("Set ipWhitelist without access", function () {
		beforeAll(function () {
			helpers.startApplication("tests/configs/noIpWhiteList.js");
		});
		afterAll(async function () {
			await helpers.stopApplication();
		});

		it("should return 403", function (done) {
			helpers.fetch(done, "http://localhost:8080").then((res) => {
				expect(res.status).toBe(403);
			});
		});
	});

	describe("Set ipWhitelist []", function () {
		beforeAll(function () {
			helpers.startApplication("tests/configs/empty_ipWhiteList.js");
		});
		afterAll(async function () {
			await helpers.stopApplication();
		});

		it("should return 200", function (done) {
			helpers.fetch(done, "http://localhost:8080").then((res) => {
				expect(res.status).toBe(200);
			});
		});
	});
});
