const fetch = require("node-fetch");
const app = require("../../js/app.js");

describe("ipWhitelist directive configuration", function () {
	beforeAll(function () {
		app.start();
	});

	afterAll(function () {
		app.stop();
	});

	describe("Set ipWhitelist without access", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/noIpWhiteList.js";
		});

		it("should return 403", function (done) {
			fetch("http://localhost:8080").then((res) => {
				expect(res.status).toBe(403);
				done();
			});
		});
	});

	describe("Set ipWhitelist []", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/empty_ipWhiteList.js";
		});

		it("should return 200", function (done) {
			fetch("http://localhost:8080").then((res) => {
				expect(res.status).toBe(200);
				done();
			});
		});
	});
});
