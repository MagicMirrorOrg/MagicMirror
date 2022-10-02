const helpers = require("./global-setup");

describe("Vendors", () => {
	beforeAll(() => {
		helpers.startApplication("tests/configs/default.js");
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Get list vendors", () => {
		const vendors = require(__dirname + "/../../vendor/vendor.js");

		Object.keys(vendors).forEach((vendor) => {
			it(`should return 200 HTTP code for vendor "${vendor}"`, (done) => {
				const urlVendor = "http://localhost:8080/vendor/" + vendors[vendor];
				helpers.fetch(done, urlVendor).then((res) => {
					expect(res.status).toBe(200);
				});
			});
		});

		Object.keys(vendors).forEach((vendor) => {
			it(`should return 404 HTTP code for vendor https://localhost/"${vendor}"`, (done) => {
				const urlVendor = "http://localhost:8080/" + vendors[vendor];
				helpers.fetch(done, urlVendor).then((res) => {
					expect(res.status).toBe(404);
				});
			});
		});
	});
});
