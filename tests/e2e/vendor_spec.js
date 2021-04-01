const helpers = require("./global-setup");
const fetch = require("node-fetch");
const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;
const before = global.before;
const after = global.after;

describe("Vendors", function () {
	helpers.setupTimeout(this);

	var app = null;

	before(function () {
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";
		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function (startedApp) {
				app = startedApp;
			});
	});

	after(function () {
		return helpers.stopApplication(app);
	});

	describe("Get list vendors", function () {
		const vendors = require(__dirname + "/../../vendor/vendor.js");
		Object.keys(vendors).forEach((vendor) => {
			it(`should return 200 HTTP code for vendor "${vendor}"`, function () {
				var urlVendor = "http://localhost:8080/vendor/" + vendors[vendor];
				fetch(urlVendor).then((res) => {
					expect(res.status).to.equal(200);
				});
			});
		});

		Object.keys(vendors).forEach((vendor) => {
			it(`should return 404 HTTP code for vendor https://localhost/"${vendor}"`, function () {
				var urlVendor = "http://localhost:8080/" + vendors[vendor];
				fetch(urlVendor).then((res) => {
					expect(res.status).to.equal(404);
				});
			});
		});
	});
});
