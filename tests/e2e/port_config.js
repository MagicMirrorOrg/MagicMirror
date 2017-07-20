const globalSetup = require("./global-setup");
const app = globalSetup.app;
const request = require("request");
const chai = require("chai");
const expect = chai.expect;


describe("port directive configuration", function () {

	this.timeout(20000);

	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});

	describe("Set port 8090", function () {
		before(function() {
			// Set config sample for use in this test
			process.env.MM_CONFIG_FILE = "tests/configs/port_8090.js";
		});
		it("should return 200", function (done) {
			request.get("http://localhost:8090", function (err, res, body) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});
	});

	describe("Set port 8100 on enviroment variable MM_PORT", function () {
		before(function() {
			process.env.MM_PORT = 8100;
			// Set config sample for use in this test
			process.env.MM_CONFIG_FILE = "tests/configs/port_8090.js";
		});

		after(function(){
			delete process.env.MM_PORT;
		});
		it("should return 200", function (done) {
			request.get("http://localhost:8100", function (err, res, body) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});
	});

});
