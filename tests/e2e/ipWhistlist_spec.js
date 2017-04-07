const globalSetup = require("./global-setup");
const app = globalSetup.app;
const request = require("request");
const chai = require("chai");
const expect = chai.expect;


describe("ipWhitelist directive configuration", function () {

	this.timeout(20000);

	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});

	describe("Set ipWhitelist without access", function () {
		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/noIpWhiteList.js";
		});
		it("should return 403", function (done) {
			request.get("http://localhost:8080", function (err, res, body) {
				expect(res.statusCode).to.equal(403);
				done();
			});
		});
	});

	describe("Set ipWhitelist []", function () {
		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/empty_ipWhiteList.js";
		});
		it("should return 200", function (done) {
			request.get("http://localhost:8080", function (err, res, body) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});
	});

});
