const helpers = require("../global-setup");
const serverBasicAuth = require("../../servers/basic-auth.js");

describe("Calendar module", function () {
	helpers.setupTimeout(this);

	let app = null;

	beforeEach(function () {
		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function (startedApp) {
				app = startedApp;
			});
	});

	afterEach(function () {
		return helpers.stopApplication(app);
	});

	describe("Default configuration", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/default.js";
		});

		it("should show the default maximumEntries of 10", async () => {
			await app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
			const events = await app.client.$$(".calendar .event");
			return expect(events.length).toBe(10);
		});

		it("should show the default calendar symbol in each event", async () => {
			await app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
			const icons = await app.client.$$(".calendar .event .fa-calendar");
			return expect(icons.length).not.toBe(0);
		});
	});

	describe("Custom configuration", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/custom.js";
		});

		it("should show the custom maximumEntries of 4", async () => {
			await app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
			const events = await app.client.$$(".calendar .event");
			return expect(events.length).toBe(4);
		});

		it("should show the custom calendar symbol in each event", async () => {
			await app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
			const icons = await app.client.$$(".calendar .event .fa-birthday-cake");
			return expect(icons.length).toBe(4);
		});

		it("should show two custom icons for repeating events", async () => {
			await app.client.waitUntilTextExists(".calendar", "TestEventRepeat", 10000);
			const icons = await app.client.$$(".calendar .event .fa-undo");
			return expect(icons.length).toBe(2);
		});

		it("should show two custom icons for day events", async () => {
			await app.client.waitUntilTextExists(".calendar", "TestEventDay", 10000);
			const icons = await app.client.$$(".calendar .event .fa-calendar-day");
			return expect(icons.length).toBe(2);
		});
	});

	describe("Recurring event", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/recurring.js";
		});

		it("should show the recurring birthday event 6 times", async () => {
			await app.client.waitUntilTextExists(".calendar", "Mar 25th", 10000);
			const events = await app.client.$$(".calendar .event");
			return expect(events.length).toBe(6);
		});
	});

	describe("Changed port", function () {
		beforeAll(function () {
			serverBasicAuth.listen(8010);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/changed-port.js";
		});

		afterAll(function (done) {
			serverBasicAuth.close(done());
		});

		it("should return TestEvents", function () {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Basic auth", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/basic-auth.js";
		});

		it("should return TestEvents", function () {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Basic auth by default", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/auth-default.js";
		});

		it("should return TestEvents", function () {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Basic auth backward compatibility configuration: DEPRECATED", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/old-basic-auth.js";
		});

		it("should return TestEvents", function () {
			return app.client.waitUntilTextExists(".calendar", "TestEvent", 10000);
		});
	});

	describe("Fail Basic auth", function () {
		beforeAll(function () {
			serverBasicAuth.listen(8020);
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/calendar/fail-basic-auth.js";
		});

		afterAll(function (done) {
			serverBasicAuth.close(done());
		});

		it("should show Unauthorized error", function () {
			return app.client.waitUntilTextExists(".calendar", "Error in the calendar module. Authorization failed", 10000);
		});
	});
});
