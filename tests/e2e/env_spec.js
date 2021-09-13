const fetch = require("node-fetch");
const app = require("app.js");

describe("Electron app environment", function () {
	beforeAll(function () {
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";

		app.start();
	});

	afterAll(function () {
		app.stop();
	});

	it("get request from http://localhost:8080 should return 200", function (done) {
		fetch("http://localhost:8080").then((res) => {
			expect(res.status).toBe(200);
			done();
		});
	});

	it("get request from http://localhost:8080/nothing should return 404", function (done) {
		fetch("http://localhost:8080/nothing").then((res) => {
			expect(res.status).toBe(404);
			done();
		});
	});
});
