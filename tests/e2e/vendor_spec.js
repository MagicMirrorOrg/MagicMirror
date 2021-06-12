const helpers = require("./global-setup");
const fetch = require("node-fetch");

const before = global.before;
const after = global.after;

describe("Vendors", function () {
	helpers.setupTimeout(this);

	let app = null;

	beforeAll(function () {
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";
		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function (startedApp) {
				app = startedApp;
			});
	});

	afterAll(function () {
		return helpers.stopApplication(app);
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
