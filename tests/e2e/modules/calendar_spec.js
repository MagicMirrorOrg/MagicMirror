const globalSetup = require("../global-setup");
const serverBasicAuth  = require("../../servers/basic-auth.js");
const app = globalSetup.app;
const chai = require("chai");
const expect = chai.expect;

describe("Calendar module", function () {

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
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/default.js";
		});

		it("Should return TestEvents", function () {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});


	describe("Basic auth", function() {
		before(function() {
			serverBasicAuth.listen(8010);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/basic-auth.js";
		});

		it("Should return TestEvents", function () {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});


	describe("Basic auth by default", function() {
		before(function() {
			serverBasicAuth.listen(8011);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/auth-default.js";
		});

		it("Should return TestEvents", function () {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Basic auth backward compatibilty configuration", function() {
		before(function() {
			serverBasicAuth.listen(8012);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/old-basic-auth.js";
		});

		it("Should return TestEvents", function () {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Fail Basic auth", function() {
		before(function() {
			serverBasicAuth.listen(8020);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/fail-basic-auth.js";
		});

		it("Should return No upcoming events", function () {
			return app.client.waitUntilTextExists(".calendar", "No upcoming events.", 10000);
		});
	});


});
