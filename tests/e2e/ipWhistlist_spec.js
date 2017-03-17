const globalSetup = require("./global-setup");
const app = globalSetup.app;
const request = require("request");
const chai = require("chai");
const expect = chai.expect;

describe("Set ipWhitelist without access", function () {

	this.timeout(20000);

	before(function() {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/noIpWhiteList.js";
	});

	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});

	it("should return 403", function (done) {
		request.get("http://localhost:8080", function (err, res, body) {
			expect(res.statusCode).to.equal(403);
			done();
		});
	});
});
