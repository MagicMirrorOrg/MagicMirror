const globalSetup = require("../global-setup");
const app = globalSetup.app;
const chai = require("chai");
const expect = chai.expect;

describe("Newsfeed module", function () {

	this.timeout(20000);

	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});

	describe("Default configuration", function() {

		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/newsfeed/default.js";
		});

		it("Check here", function () {
			return app.client.waitUntilTextExists(".newsfeed .small", "New York Times, in day:", 10000);
		});

	});

});
