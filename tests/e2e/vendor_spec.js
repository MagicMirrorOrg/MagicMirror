const fetch = require("node-fetch");
const app = require("app.js");

describe("Vendors", function () {
	beforeAll(function () {
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";

		app.start();
	});

	afterAll(function () {
		app.stop();
	});

	describe("Get list vendors", function () {
		const vendors = require(__dirname + "/../../vendor/vendor.js");

		Object.keys(vendors).forEach((vendor) => {
			it(`should return 200 HTTP code for vendor "${vendor}"`, function (done) {
				const urlVendor = "http://localhost:8080/vendor/" + vendors[vendor];
				fetch(urlVendor).then((res) => {
					expect(res.status).toBe(200);
					done();
				});
			});
		});

		Object.keys(vendors).forEach((vendor) => {
			it(`should return 404 HTTP code for vendor https://localhost/"${vendor}"`, function (done) {
				const urlVendor = "http://localhost:8080/" + vendors[vendor];
				fetch(urlVendor).then((res) => {
					expect(res.status).toBe(404);
					done();
				});
			});
		});
	});
});
