const fetch = require("node-fetch");
const app = require("app.js");

describe("port directive configuration", function () {
	beforeAll(function () {
		process.env.MM_CONFIG_FILE = "tests/configs/port_8090.js";

		app.start();
	});

	afterAll(function () {
		app.stop();
	});

	describe("Set port 8090", function () {
		it("should return 200", function (done) {
			fetch("http://localhost:8090").then((res) => {
				expect(res.status).toBe(200);
				done();
			});
		});
	});

	describe("Set port 8100 on environment variable MM_PORT", function () {
		beforeAll(function () {
			process.env.MM_PORT = 8100;
		});

		afterAll(function () {
			delete process.env.MM_PORT;
		});

		it("should return 200", function (done) {
			fetch("http://localhost:8100").then((res) => {
				expect(res.status).toBe(200);
				done();
			});
		});
	});
});
