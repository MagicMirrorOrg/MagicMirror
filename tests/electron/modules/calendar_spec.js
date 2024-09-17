const helpers = require("../helpers/global-setup");

describe("Calendar module", () => {

	/**
	 * move similar tests in function doTest
	 * @param {string} cssClass css selector
	 * @returns {boolean} result
	 */
	const doTest = async (cssClass) => {
		const elem = await helpers.getElement(`.calendar .module-content .event${cssClass}`);
		await expect(elem.isVisible()).resolves.toBe(true);
		return true;
	};

	const doTestCount = async () => {
		expect(global.page).not.toBeNull();
		const loc = await global.page.locator(".calendar .event");
		const elem = loc.first();
		await elem.waitFor();
		expect(elem).not.toBeNull();
		return await loc.count();
	};

	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("Test css classes", () => {
		it("has css class dayBeforeYesterday", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "03 Jan 2030 12:30:00 GMT");
			await expect(doTest(".dayBeforeYesterday")).resolves.toBe(true);
		});

		it("has css class yesterday", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "02 Jan 2030 12:30:00 GMT");
			await expect(doTest(".yesterday")).resolves.toBe(true);
		});

		it("has css class today", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "01 Jan 2030 12:30:00 GMT");
			await expect(doTest(".today")).resolves.toBe(true);
		});

		it("has css class tomorrow", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "31 Dec 2029 12:30:00 GMT");
			await expect(doTest(".tomorrow")).resolves.toBe(true);
		});

		it("has css class dayAfterTomorrow", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "30 Dec 2029 12:30:00 GMT");
			await expect(doTest(".dayAfterTomorrow")).resolves.toBe(true);
		});
	});

	describe("Events from multiple calendars", () => {
		it("should show multiple events with the same title and start time from different calendars", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/show-duplicates-in-calendar.js", "15 Sep 2024 12:30:00 GMT");
			await expect(doTestCount()).resolves.toBe(20);
		});
	});

	/*
	 * RRULE TESTS:
	 * Add any tests that check rrule functionality here.
	 */
	describe("rrule", () => {
		it("Issue #3393 recurrence dates past rrule until date", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/rrule_until.js", "07 Mar 2024 10:38:00 GMT-07:00", ["js/electron.js"], "America/Los_Angeles");
			await expect(doTestCount()).resolves.toBe(1);
		});
	});

	/*
	 * LOS ANGELES TESTS:
	 *  In 2023, DST (GMT-7) was until 5 Nov, after which is standard (STD) (GMT-8) time.
	 *  Test takes place on Thu 19 Oct, recurring event on a Wednesday. maximumNumberOfDays=28, so there should be
	 *  4 events (25 Oct, 1 Nov, (switch to STD), 8 Nov, Nov 15), but 1 Nov and 8 Nov are excluded.
	 *  There are three separate tests:
	 *  * before midnight GMT (3pm local time)
	 *  * at midnight GMT in STD time (4pm local time)
	 *  * at midnight GMT in DST time (5pm local time)
	 */
	describe("Exdate: LA crossover DST before midnight GMT", () => {
		it("LA crossover DST before midnight GMT should have 2 events", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/exdate_la_before_midnight.js", "19 Oct 2023 12:30:00 GMT-07:00", ["js/electron.js"], "America/Los_Angeles");
			await expect(doTestCount()).resolves.toBe(2);
		});
	});

	describe("Exdate: LA crossover DST at midnight GMT local STD", () => {
		it("LA crossover DST before midnight GMT should have 2 events", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/exdate_la_at_midnight_std.js", "19 Oct 2023 12:30:00 GMT-07:00", ["js/electron.js"], "America/Los_Angeles");
			await expect(doTestCount()).resolves.toBe(2);
		});
	});
	describe("Exdate: LA crossover DST at midnight GMT local DST", () => {
		it("LA crossover DST before midnight GMT should have 2 events", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/exdate_la_at_midnight_dst.js", "19 Oct 2023 12:30:00 GMT-07:00", ["js/electron.js"], "America/Los_Angeles");
			await expect(doTestCount()).resolves.toBe(2);
		});
	});

	/*
	 * SYDNEY TESTS:
	 *  In 2023, standard time (STD) (GMT+10) was until 1 Oct, after which is DST (GMT+11).
	 *  Test takes place on Thu 14 Sep, recurring event on a Wednesday. maximumNumberOfDays=28, so there should be
	 *  4 events (20 Sep, 27 Sep, (switch to DST), 4 Oct, 11 Oct), but 27 Sep and 4 Oct are excluded.
	 *  There are three separate tests:
	 *  * before midnight GMT (9am local time)
	 *  * at midnight GMT in STD time (10am local time)
	 *  * at midnight GMT in DST time (11am local time)
	 */
	describe("Exdate: SYD crossover DST before midnight GMT", () => {
		it("LA crossover DST before midnight GMT should have 2 events", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/exdate_syd_before_midnight.js", "14 Sep 2023 12:30:00 GMT+10:00", ["js/electron.js"], "Australia/Sydney");
			await expect(doTestCount()).resolves.toBe(2);
		});
	});
	describe("Exdate: SYD crossover DST at midnight GMT local STD", () => {
		it("LA crossover DST before midnight GMT should have 2 events", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/exdate_syd_at_midnight_std.js", "14 Sep 2023 12:30:00 GMT+10:00", ["js/electron.js"], "Australia/Sydney");
			await expect(doTestCount()).resolves.toBe(2);
		});
	});
	describe("Exdate: SYD crossover DST at midnight GMT local DST", () => {
		it("SYD crossover DST at midnight GMT local DST should have 2 events", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/exdate_syd_at_midnight_dst.js", "14 Sep 2023 12:30:00 GMT+10:00", ["js/electron.js"], "Australia/Sydney");
			await expect(doTestCount()).resolves.toBe(2);
		});
	});

	/*
         * RRULE TESTS:
         * Add any tests that check rrule functionality here.
         */
	describe("sliceMultiDayEvents", () => {
		it("Issue #3452 split multiday in Europe", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/sliceMultiDayEvents.js", "01 Sept 2024 10:38:00 GMT+02:00", ["js/electron.js"], "Europe/Berlin");
			expect(global.page).not.toBeNull();
			const loc = await global.page.locator(".calendar .event");
			const elem = loc.first();
			await elem.waitFor();
			expect(elem).not.toBeNull();
			const cnt = await loc.count();
			expect(cnt).toBe(6);
		});
	});

});
