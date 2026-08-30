const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");
const serverBasicAuth = require("../helpers/basic-auth");

describe("Calendar module", () => {
	let page;

	/**
	 * Assert the number of matching elements.
	 * @param {string} selector css selector
	 * @param {number} expectedLength expected number of elements
	 * @param {string} [not] optional negation marker (use "not" to negate)
	 * @returns {Promise<void>}
	 */
	const testElementLength = async (selector, expectedLength, not) => {
		const locator = page.locator(selector);
		if (not === "not") {
			await expect(locator).not.toHaveCount(expectedLength);
		} else {
			await expect(locator).toHaveCount(expectedLength);
		}
	};

	const testTextContain = async (selector, expectedText) => {
		await expect(page.locator(selector).first()).toContainText(expectedText);
	};

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Default configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/default.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the default maximumEntries of 10", async () => {
			await testElementLength(".calendar .event", 10);
		});

		it("should show the default calendar symbol in each event", async () => {
			await testElementLength(".calendar .event .fa-calendar-days", 0, "not");
		});
	});

	describe("Custom configuration", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js");
			await helpers.getDocument();
			page = helpers.getPage();
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

		it("should show a customEvent calendar eventClass in one event", async () => {
			await testElementLength(".calendar .event.undo", 1);
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
			page = helpers.getPage();
		});

		it("should show the recurring birthday event 6 times", async () => {
			await testElementLength(".calendar .event", 6);
		});
	});

	//Will contain everyday an fullDayEvent that starts today and ends tomorrow, and one starting tomorrow and ending the day after tomorrow
	describe("FullDayEvent over several days should show how many days are left from the from the starting date on", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/long-fullday-event.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should contain text 'Ends in' with the left days", async () => {
			await testTextContain(".calendar .today .time", "Ends in");
			await testTextContain(".calendar .yesterday .time", "Today");
			await testTextContain(".calendar .tomorrow .time", "Tomorrow");
		});
		it("should contain in total three events", async () => {
			await testElementLength(".calendar .event", 3);
		});
	});

	describe("FullDayEvent Single day, should show Today", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/single-fullday-event.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should contain text 'Today'", async () => {
			await testTextContain(".calendar .time", "Today");
		});
		it("should contain in total two events", async () => {
			await testElementLength(".calendar .event", 2);
		});
	});

	describe("Changed port", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/changed-port.js");
			serverBasicAuth.listen(8010);
			await helpers.getDocument();
			page = helpers.getPage();
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
			page = helpers.getPage();
		});

		it("should return TestEvents", async () => {
			await testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Basic auth by default", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/auth-default.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should return TestEvents", async () => {
			await testElementLength(".calendar .event", 0, "not");
		});
	});

	describe("Basic auth backward compatibility configuration: DEPRECATED", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/old-basic-auth.js");
			await helpers.getDocument();
			page = helpers.getPage();
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
			page = helpers.getPage();
		});

		afterAll(async () => {
			await serverBasicAuth.close();
		});

		it("should show Unauthorized error", async () => {
			await testTextContain(".calendar", "Error in the calendar module. Authorization failed");
		});
	});
});
