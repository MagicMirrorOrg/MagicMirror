const fetch = require("node-fetch");
const helpers = require("./global-setup");

describe("port directive configuration", function () {
	describe("Set port 8090", function () {
		beforeAll(function () {
			helpers.startApplication("tests/configs/port_8090.js");
		});
		afterAll(function () {
			helpers.stopApplication();
		});

		it("should return 200", function (done) {
			fetch("http://localhost:8090").then((res) => {
				expect(res.status).toBe(200);
				done();
			});
		});
	});

	describe("Set port 8100 on environment variable MM_PORT", function () {
		beforeAll(function () {
			helpers.startApplication("tests/configs/port_8090.js", (process.env.MM_PORT = 8100));
		});
		afterAll(function () {
			helpers.stopApplication();
		});

		it("should return 200", function (done) {
			fetch("http://localhost:8100").then((res) => {
				expect(res.status).toBe(200);
				done();
			});
		});
	});
});
