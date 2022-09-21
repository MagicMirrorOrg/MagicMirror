const helpers = require("../global-setup");
const serverBasicAuth = require("./basic-auth.js");

describe("Calendar module", () => {
	/**
	 * @param {string} done test done
	 * @param {string} element css selector
	 * @param {string} result expected number
	 * @param {string} not reverse result
	 */
	const testElementLength = (done, element, result, not) => {
		helpers.waitForAllElements(element).then((elem) => {
			done();
			expect(elem).not.toBe(null);
			if (not === "not") {
				expect(elem.length).not.toBe(result);
			} else {
				expect(elem.length).toBe(result);
			}
		});
	};

	const testTextContain = (done, element, text) => {
		helpers.waitForElement(element, "undefinedLoading").then((elem) => {
			done();
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain(text);
		});
	};

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Default configuration", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/calendar/default.js");
			helpers.getDocument(done);
		});

		it("should show the default maximumEntries of 10", (done) => {
			testElementLength(done, ".calendar .event", 10);
		});

		it("should show the default calendar symbol in each event", (done) => {
			testElementLength(done, ".calendar .event .fa-calendar-alt", 0, "not");
		});
	});

	describe("Custom configuration", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/calendar/custom.js");
			helpers.getDocument(done);
		});

		it("should show the custom maximumEntries of 4", (done) => {
			testElementLength(done, ".calendar .event", 4);
		});

		it("should show the custom calendar symbol in each event", (done) => {
			testElementLength(done, ".calendar .event .fa-birthday-cake", 4);
		});

		it("should show two custom icons for repeating events", (done) => {
			testElementLength(done, ".calendar .event .fa-undo", 2);
		});

		it("should show two custom icons for day events", (done) => {
			testElementLength(done, ".calendar .event .fa-calendar-day", 2);
		});
	});

	describe("Recurring event", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/calendar/recurring.js");
			helpers.getDocument(done);
		});

		it("should show the recurring birthday event 6 times", (done) => {
			testElementLength(done, ".calendar .event", 6);
		});
	});

	process.setMaxListeners(0);
	for (let i = -12; i < 12; i++) {
		describe("Recurring event per timezone", () => {
			beforeAll((done) => {
				Date.prototype.getTimezoneOffset = () => {
					return i * 60;
				};
				helpers.startApplication("tests/configs/modules/calendar/recurring.js");
				helpers.getDocument(done);
			});

			it('should contain text "Mar 25th" in timezone UTC ' + -i, (done) => {
				testTextContain(done, ".calendar", "Mar 25th");
			});
		});
	}

	describe("Changed port", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/calendar/changed-port.js");
			serverBasicAuth.listen(8010);
			helpers.getDocument(done);
		});

		afterAll((done) => {
			serverBasicAuth.close(done());
		});

		it("should return TestEvents", (done) => {
			testElementLength(done, ".calendar .event", 0, "not");
		});
	});

	describe("Basic auth", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/calendar/basic-auth.js");
			helpers.getDocument(done);
		});

		it("should return TestEvents", (done) => {
			testElementLength(done, ".calendar .event", 0, "not");
		});
	});

	describe("Basic auth by default", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/calendar/auth-default.js");
			helpers.getDocument(done);
		});

		it("should return TestEvents", (done) => {
			testElementLength(done, ".calendar .event", 0, "not");
		});
	});

	describe("Basic auth backward compatibility configuration: DEPRECATED", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/calendar/old-basic-auth.js");
			helpers.getDocument(done);
		});

		it("should return TestEvents", (done) => {
			testElementLength(done, ".calendar .event", 0, "not");
		});
	});

	describe("Fail Basic auth", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/calendar/fail-basic-auth.js");
			serverBasicAuth.listen(8020);
			helpers.getDocument(done);
		});

		afterAll((done) => {
			serverBasicAuth.close(done());
		});

		it("should show Unauthorized error", (done) => {
			testTextContain(done, ".calendar", "Error in the calendar module. Authorization failed");
		});
	});
});
