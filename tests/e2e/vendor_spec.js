const helpers = require("./global-setup");
const path = require("path");
const request = require("request");

const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe("Vendors", function () {
	helpers.setupTimeout(this);

	var app = null;

	beforeEach(function () {
		return helpers.startApplication({
			args: ["js/electron.js"]
		}).then(function (startedApp) { app = startedApp; })
	});

	afterEach(function () {
		return helpers.stopApplication(app);
	});

	describe("Get list vendors", function () {

		before(function () {
			process.env.MM_CONFIG_FILE = "tests/configs/env.js";
		});

		var vendors = require(__dirname + "/../../vendor/vendor.js");
		Object.keys(vendors).forEach(vendor => {
			it(`should return 200 HTTP code for vendor "${vendor}"`, function () {
				urlVendor = "http://localhost:8080/vendor/" + vendors[vendor];
				request.get(urlVendor, function (err, res, body) {
					expect(res.statusCode).to.equal(200);
				});
			});
		});
	});
});
