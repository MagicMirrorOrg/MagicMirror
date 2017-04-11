const globalSetup = require("./global-setup");
const app = globalSetup.app;
const request = require("request");
const chai = require("chai");
const expect = chai.expect;


describe("Vendors", function () {

	this.timeout(20000);

	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});

	describe("Get list vendors", function () {

		before(function() {
			process.env.MM_CONFIG_FILE = "tests/configs/env.js";
		});

		var vendors = require(__dirname + "/../../vendor/vendor.js");
		Object.keys(vendors).forEach(vendor => {
			it(`should return 200 HTTP code for vendor "${vendor}"`, function() {
				urlVendor = "http://localhost:8080/vendor/" + vendors[vendor];
				request.get(urlVendor, function (err, res, body) {
					expect(res.statusCode).to.equal(200);
				});
			});
		});
	});
});
