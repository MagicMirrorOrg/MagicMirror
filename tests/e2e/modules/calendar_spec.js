const helpers = require("../global-setup");
const serverBasicAuth = require("../../servers/basic-auth.js");

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe("Calendar module", function() {
	helpers.setupTimeout(this);

	var app = null;

	beforeEach(function() {
		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function(startedApp) {
				app = startedApp;
			});
	});

	afterEach(function() {
		return helpers.stopApplication(app);
	});

	describe("Default configuration", function() {
		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/default.js";
		});

		it("Should return TestEvents", function() {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Basic auth", function() {
		before(function() {
			serverBasicAuth.listen(8010);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/basic-auth.js";
		});

		after(function(done) {
			serverBasicAuth.close(done());
		});

		it("Should return TestEvents", function() {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Basic auth by default", function() {
		before(function() {
			serverBasicAuth.listen(8011);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/auth-default.js";
		});

		after(function(done) {
			serverBasicAuth.close(done());
		});

		it("Should return TestEvents", function() {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Basic auth backward compatibility configuration: DEPRECATED", function() {
		before(function() {
			serverBasicAuth.listen(8012);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/old-basic-auth.js";
		});

		after(function(done) {
			serverBasicAuth.close(done());
		});

		it("Should return TestEvents", function() {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Fail Basic auth", function() {
		before(function() {
			serverBasicAuth.listen(8020);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/fail-basic-auth.js";
		});

		after(function(done) {
			serverBasicAuth.close(done());
		});

		it("Should return No upcoming events", function() {
			return app.client.waitUntilTextExists(".calendar", "No upcoming events.", 10000);
		});
	});
});
