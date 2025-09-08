const helpers = require("../helpers/global-setup");
const serverBasicAuth = require("../helpers/basic-auth");

describe("Calendar module", () => {

	/**
	 * @param {string} element css selector
	 * @param {string} result expected number
	 * @param {string} not reverse result
	 * @returns {boolean} result
	 */
	const testElementLength = async (element, result, not) => {
		const elem = await helpers.waitForAllElements(element);
		expect(elem).not.toBeNull();
		if (not === "not") {
			expect(elem).not.toHaveLength(result);
		} else {
			expect(elem).toHaveLength(result);
		}
		return true;
	};

	const testTextContain = async (element, text) => {
		const elem = await helpers.waitForElement(element, "undefinedLoading");
		expect(elem).not.toBeNull();
		expect(elem.textContent).toContain(text);
		return true;
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
			await expect(testElementLength(".calendar .event", 10)).resolves.toBe(true);
		});

		it("should show the default calendar symbol in each event", async () => {
			await expect(testElementLength(".calendar .event .fa-calendar-days", 0, "not")).resolves.toBe(true);
		});
	});

	describe("Custom configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js");
			await helpers.getDocument();
		});

		it("should show the custom maximumEntries of 5", async () => {
			await expect(testElementLength(".calendar .event", 5)).resolves.toBe(true);
		});

		it("should show the custom calendar symbol in four events", async () => {
			await expect(testElementLength(".calendar .event .fa-birthday-cake", 4)).resolves.toBe(true);
		});

		it("should show a customEvent calendar symbol in one event", async () => {
			await expect(testElementLength(".calendar .event .fa-dice", 1)).resolves.toBe(true);
		});

		it("should show a customEvent calendar eventClass in one event", async () => {
			await expect(testElementLength(".calendar .event.undo", 1)).resolves.toBe(true);
		});

		it("should show two custom icons for repeating events", async () => {
			await expect(testElementLength(".calendar .event .fa-undo", 2)).resolves.toBe(true);
		});

		it("should show two custom icons for day events", async () => {
			await expect(testElementLength(".calendar .event .fa-calendar-day", 2)).resolves.toBe(true);
		});
	});

	describe("Recurring event", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/recurring.js");
			await helpers.getDocument();
		});

		it("should show the recurring birthday event 6 times", async () => {
			await expect(testElementLength(".calendar .event", 6)).resolves.toBe(true);
		});
	});

	//Will contain everyday an fullDayEvent that starts today and ends tomorrow, and one starting tomorrow and ending the day after tomorrow
	describe("FullDayEvent over several days should show how many days are left from the from the starting date on", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/long-fullday-event.js");
			await helpers.getDocument();
		});

		it("should contain text 'Ends in' with the left days", async () => {
			await expect(testTextContain(".calendar .today .time", "Ends in")).resolves.toBe(true);
			await expect(testTextContain(".calendar .yesterday .time", "Today")).resolves.toBe(true);
			await expect(testTextContain(".calendar .tomorrow .time", "Tomorrow")).resolves.toBe(true);
		});
		it("should contain in total three events", async () => {
			await expect(testElementLength(".calendar .event", 3)).resolves.toBe(true);
		});
	});

	describe("FullDayEvent Single day, should show Today", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/single-fullday-event.js");
			await helpers.getDocument();
		});

		it("should contain text 'Today'", async () => {
			await expect(testTextContain(".calendar .time", "Today")).resolves.toBe(true);
		});
		it("should contain in total two events", async () => {
			await expect(testElementLength(".calendar .event", 2)).resolves.toBe(true);
		});
	});

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
				await expect(testTextContain(".calendar", "Mar 25th")).resolves.toBe(true);
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
			await expect(testElementLength(".calendar .event", 0, "not")).resolves.toBe(true);
		});
	});

	describe("Basic auth", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/basic-auth.js");
			await helpers.getDocument();
		});

		it("should return TestEvents", async () => {
			await expect(testElementLength(".calendar .event", 0, "not")).resolves.toBe(true);
		});
	});

	describe("Basic auth by default", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/auth-default.js");
			await helpers.getDocument();
		});

		it("should return TestEvents", async () => {
			await expect(testElementLength(".calendar .event", 0, "not")).resolves.toBe(true);
		});
	});

	describe("Basic auth backward compatibility configuration: DEPRECATED", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/old-basic-auth.js");
			await helpers.getDocument();
		});

		it("should return TestEvents", async () => {
			await expect(testElementLength(".calendar .event", 0, "not")).resolves.toBe(true);
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
			await expect(testTextContain(".calendar", "Error in the calendar module. Authorization failed")).resolves.toBe(true);
		});
	});
});
