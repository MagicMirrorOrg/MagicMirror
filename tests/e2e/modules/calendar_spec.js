const helpers = require("../global-setup");
const serverBasicAuth = require("./basic-auth.js");

describe("Calendar module", function () {
	/**
	 * @param {string} element css selector
	 * @param {string} result expected number
	 * @param {string} not reverse result
	 */
	function testElementLength(element, result, not) {
		helpers.waitForElement(element).then((elem) => {
			expect(elem).not.toBe(null);
			if (not === "not") {
				expect(elem.length).not.toBe(result);
			} else {
				expect(elem.length).toBe(result);
			}
		});
	}

	const testTextContain = function (element, text) {
		helpers.waitForElement(element).then((elem) => {
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain(text);
		});
	};

	afterAll(function () {
		helpers.stopApplication();
	});

	describe("Default configuration", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/calendar/default.js");
			helpers.getDocument(done);
		});

		it("should show the default maximumEntries of 10", () => {
			testElementLength(".calendar .event", 10);
		});

		it("should show the default calendar symbol in each event", () => {
			testElementLength(".calendar .event .fa-calendar-alt", 0, "not");
		});
	});

	describe("Custom configuration", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/calendar/custom.js");
			helpers.getDocument(done);
		});

		it("should show the custom maximumEntries of 4", () => {
			testElementLength(".calendar .event", 4);
		});

		it("should show the custom calendar symbol in each event", () => {
			testElementLength(".calendar .event .fa-birthday-cake", 4);
		});

		it("should show two custom icons for repeating events", () => {
			testElementLength(".calendar .event .fa-undo", 2);
		});

		it("should show two custom icons for day events", () => {
			testElementLength(".calendar .event .fa-calendar-day", 2);
		});
	});

	describe("Recurring event", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/calendar/recurring.js");
			helpers.getDocument(done);
		});

		it("should show the recurring birthday event 6 times", () => {
			testElementLength(".calendar .event", 6);
		});
	});

	process.setMaxListeners(0);
	for (let i = -12; i < 12; i++) {
		describe("Recurring event per timezone", function () {
			beforeAll(function (done) {
				Date.prototype.getTimezoneOffset = function () {
					return i * 60;
				};
				helpers.startApplication("tests/configs/modules/calendar/recurring.js");
				helpers.getDocument(done);
			});

			it('should contain text "Mar 25th" in timezone UTC ' + -i, () => {
				testTextContain(".calendar", "Mar 25th");
			});
		});
	}

	describe("Changed port", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/calendar/changed-port.js");
			serverBasicAuth.listen(8010);
			helpers.getDocument(done);
		});

		afterAll(function (done) {
			serverBasicAuth.close(done());
		});

		it("should return TestEvents", function () {
			testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Basic auth", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/calendar/basic-auth.js");
			helpers.getDocument(done);
		});

		it("should return TestEvents", function () {
			testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Basic auth by default", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/calendar/auth-default.js");
			helpers.getDocument(done);
		});

		it("should return TestEvents", function () {
			testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Basic auth backward compatibility configuration: DEPRECATED", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/calendar/old-basic-auth.js");
			helpers.getDocument(done);
		});

		it("should return TestEvents", function () {
			testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Fail Basic auth", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/calendar/fail-basic-auth.js");
			serverBasicAuth.listen(8020);
			helpers.getDocument(done);
		});

		afterAll(function (done) {
			serverBasicAuth.close(done());
		});

		it("should show Unauthorized error", function () {
			testTextContain(".calendar", "Error in the calendar module. Authorization failed");
		});
	});
});
