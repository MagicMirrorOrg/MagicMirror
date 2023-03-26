const helpers = require("../helpers/global-setup");
const serverBasicAuth = require("../helpers/basic-auth");

describe("Calendar module", () => {
	/**
	 * @param {string} element css selector
	 * @param {string} result expected number
	 * @param {string} not reverse result
	 */
	const testElementLength = async (element, result, not) => {
		const elem = await helpers.waitForAllElements(element);
		expect(elem).not.toBe(null);
		if (not === "not") {
			expect(elem.length).not.toBe(result);
		} else {
			expect(elem.length).toBe(result);
		}
	};

	const testTextContain = async (element, text) => {
		const elem = await helpers.waitForElement(element, "undefinedLoading");
		expect(elem).not.toBe(null);
		expect(elem.textContent).toContain(text);
	};

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Default configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/default.js");
			await helpers.getDocument();
		});

		it("should show the default maximumEntries of 10", async () => {
			await testElementLength(".calendar .event", 10);
		});

		it("should show the default calendar symbol in each event", async () => {
			await testElementLength(".calendar .event .fa-calendar-alt", 0, "not");
		});
	});

	describe("Custom configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js");
			await helpers.getDocument();
		});

		it("should show the custom maximumEntries of 5", async () => {
			await testElementLength(".calendar .event", 5);
		});

		it("should show the custom calendar symbol in four events", async () => {
			await testElementLength(".calendar .event .fa-birthday-cake", 4);
		});

		it("should show a customEvent calendar symbol in one event", async () => {
			await testElementLength(".calendar .event .fa-dice", 1);
		});

		it("should show two custom icons for repeating events", async () => {
			await testElementLength(".calendar .event .fa-undo", 2);
		});

		it("should show two custom icons for day events", async () => {
			await testElementLength(".calendar .event .fa-calendar-day", 2);
		});
	});

	describe("Recurring event", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/recurring.js");
			await helpers.getDocument();
		});

		it("should show the recurring birthday event 6 times", async () => {
			await testElementLength(".calendar .event", 6);
		});
	});

	process.setMaxListeners(0);
	for (let i = -12; i < 12; i++) {
		describe("Recurring event per timezone", () => {
			beforeAll(async () => {
				Date.prototype.getTimezoneOffset = () => {
					return i * 60;
				};
				await helpers.startApplication("tests/configs/modules/calendar/recurring.js");
				await helpers.getDocument();
			});

			it(`should contain text "Mar 25th" in timezone UTC ${-i}`, async () => {
				await testTextContain(".calendar", "Mar 25th");
			});
		});
	}

	describe("Changed port", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/changed-port.js");
			serverBasicAuth.listen(8010);
			await helpers.getDocument();
		});

		afterAll(async () => {
			await serverBasicAuth.close();
		});

		it("should return TestEvents", async () => {
			await testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Basic auth", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/basic-auth.js");
			await helpers.getDocument();
		});

		it("should return TestEvents", async () => {
			await testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Basic auth by default", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/auth-default.js");
			await helpers.getDocument();
		});

		it("should return TestEvents", async () => {
			await testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Basic auth backward compatibility configuration: DEPRECATED", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/old-basic-auth.js");
			await helpers.getDocument();
		});

		it("should return TestEvents", async () => {
			await testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Fail Basic auth", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/fail-basic-auth.js");
			serverBasicAuth.listen(8020);
			await helpers.getDocument();
		});

		afterAll(async () => {
			await serverBasicAuth.close();
		});

		it("should show Unauthorized error", async () => {
			await testTextContain(".calendar", "Error in the calendar module. Authorization failed");
		});
	});
});
