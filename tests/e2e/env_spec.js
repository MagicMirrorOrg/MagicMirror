const fetch = require("node-fetch");
const helpers = require("./global-setup");
let app = null;

describe("Electron app environment", function () {
	beforeAll(function () {
		app = helpers.startApplication("tests/configs/env.js");
	});
	afterAll(function () {
		helpers.stopApplication(app);
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
