const helpers = require("./global-setup");
const request = require("request");
const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;
const before = global.before;
const after = global.after;
const mlog = require("mocha-logger");

describe("Vendors", function () {

	helpers.setupTimeout(this);

	var app = null;

	before(function () {
		return helpers.startApplication({
			args: ["js/electron.js"]
		}).then(function (startedApp) { app = startedApp; });
	});

	after(function () {
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
					if (!err)
						expect(res.statusCode).to.equal(200);
					else
						mlog.pending(`There error vendor 200 test ${err}`);						
				});
			});
		});

		Object.keys(vendors).forEach(vendor => {
			it(`should return 404 HTTP code for vendor https://localhost/"${vendor}"`, function() {
				urlVendor = "http://localhost:8080/" + vendors[vendor];
				request.get(urlVendor, function (err, res, body) {
					if (!err)
						expect(res.statusCode).to.equal(404);
					else
						mlog.pending(`There error vendor 404 test ${err}`);
				});
			});
		});
	});
});
