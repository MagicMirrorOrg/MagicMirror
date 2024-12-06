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

	const first = 0;
	const second = 1;
	const third = 2;
	const last = -1;

	// get results of table row and column, can select specific row of results,
	// row is 0 based index  -1 is last, 0 is first...  need 10th(human count), use 9 as row
	// uses playwright nth locator syntax
	const doTestTableContent = async (table_row, table_column, content, row = first) => {
		const elem = await global.page.locator(table_row);
		const date = await global.page.locator(table_column).locator(`nth=${row}`);
		await expect(date.textContent()).resolves.toContain(content);
		return true;
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

	describe("sliceMultiDayEvents direct count", () => {
		it("Issue #3452 split multiday in Europe", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/sliceMultiDayEvents.js", "01 Sept 2024 10:38:00 GMT+02:00", ["js/electron.js"], "Europe/Berlin");
			await expect(doTestCount()).resolves.toBe(6);
		});
	});

	describe("germany timezone", () => {
		it("Issue #unknown fullday timezone East of UTC edge", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/germany_at_end_of_day_repeating.js", "01 Oct 2024 10:38:00 GMT+02:00", ["js/electron.js"], "Europe/Berlin");
			await expect(doTestTableContent(".calendar .event", ".time", "Oct 22nd, 23:00", first)).resolves.toBe(true);
		});
	});

	describe("germany all day repeating moved (recurrence and exdate)", () => {
		it("Issue #unknown fullday timezone East of UTC event moved", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/3_move_first_allday_repeating_event.js", "01 Oct 2024 10:38:00 GMT+02:00", ["js/electron.js"], "Europe/Berlin");
			await expect(doTestTableContent(".calendar .event", ".time", "12th.Oct")).resolves.toBe(true);
		});
	});

	describe("chicago late in timezone", () => {
		it("Issue #unknown rrule US close to timezone edge", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/chicago_late_in_timezone.js", "01 Sept 2024 10:38:00 GMT-5:00", ["js/electron.js"], "America/Chicago");
			await expect(doTestTableContent(".calendar .event", ".time", "10th.Sep, 20:15")).resolves.toBe(true);
		});
	});

	describe("berlin late in day event moved, viewed from berlin", () => {
		it("Issue #unknown rrule ETC+2 close to timezone edge", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/end_of_day_berlin_moved.js", "08 Oct 2024 12:30:00 GMT+02:00", ["js/electron.js"], "Europe/Berlin");
			await expect(doTestTableContent(".calendar .event", ".time", "24th.Oct, 23:00-00:00", last)).resolves.toBe(true);
		});
	});

	describe("berlin late in day event moved, viewed from sydney", () => {
		it("Issue #unknown rrule ETC+2 close to timezone edge", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/end_of_day_berlin_moved.js", "08 Oct 2024 12:30:00 GMT+02:00", ["js/electron.js"], "Australia/Sydney");
			await expect(doTestTableContent(".calendar .event", ".time", "25th.Oct, 01:00-02:00", last)).resolves.toBe(true);
		});
	});

	describe("berlin late in day event moved, viewed from chicago", () => {
		it("Issue #unknown rrule ETC+2 close to timezone edge", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/end_of_day_berlin_moved.js", "08 Oct 2024 12:30:00 GMT+02:00", ["js/electron.js"], "America/Chicago");
			await expect(doTestTableContent(".calendar .event", ".time", "24th.Oct, 16:00-17:00", last)).resolves.toBe(true);
		});
	});

	describe("berlin multi-events inside offset", () => {
		it("some events before DST. some after midnight", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/berlin_multi.js", "08 Oct 2024 12:30:00 GMT+02:00", ["js/electron.js"], "Europe/Berlin");
			await expect(doTestTableContent(".calendar .event", ".time", "30th.Oct, 00:00-01:00", last)).resolves.toBe(true);
			await expect(doTestTableContent(".calendar .event", ".time", "21st.Oct, 00:00-01:00", first)).resolves.toBe(true);
		});
	});

	describe("berlin whole day repeating, start moved after end", () => {
		it("some events before DST. some after", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/berlin_whole_day_event_moved_over_dst_change.js", "08 Oct 2024 12:30:00 GMT+02:00", ["js/electron.js"], "Europe/Berlin");
			await expect(doTestTableContent(".calendar .event", ".time", "30th.Oct", last)).resolves.toBe(true);
			await expect(doTestTableContent(".calendar .event", ".time", "27th.Oct", first)).resolves.toBe(true);
		});
	});

	describe("berlin 11pm-midnight", () => {
		it("right inside the offset, before midnight", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/berlin_end_of_day_repeating.js", "08 Oct 2024 12:30:00 GMT+02:00", ["js/electron.js"], "Europe/Berlin");
			await expect(doTestTableContent(".calendar .event", ".time", "24th.Oct, 23:00-00:00", last)).resolves.toBe(true);
			await expect(doTestTableContent(".calendar .event", ".time", "22nd.Oct, 23:00-00:00", first)).resolves.toBe(true);
		});
	});

	describe("both moved and delete events in recurring list", () => {
		it("with moved before and after original", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/exdate_and_recurrence_together.js", "08 Oct 2024 12:30:00 GMT-07:00", ["js/electron.js"], "America/Los_Angeles");
			// moved after end at oct 26
			await expect(doTestTableContent(".calendar .event", ".time", "27th.Oct, 14:30-15:30", last)).resolves.toBe(true);
			// moved before start at oct 23
			await expect(doTestTableContent(".calendar .event", ".time", "22nd.Oct, 14:30-15:30", first)).resolves.toBe(true);
			// remaining original 4th, now 3rd
			await expect(doTestTableContent(".calendar .event", ".time", "26th.Oct, 14:30-15:30", second)).resolves.toBe(true);
		});
	});

	describe("one event diff tz", () => {
		it("start/end in diff timezones", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/diff_tz_start_end.js", "08 Oct 2024 12:30:00 GMT-07:00", ["js/electron.js"], "America/Chicago");
			// just
			await expect(doTestTableContent(".calendar .event", ".time", "29th.Oct, 05:00-30th.Oct, 18:00", first)).resolves.toBe(true);
		});
	});

	describe("one event non repeating", () => {
		it("fullday non-repeating", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/fullday_event_over_multiple_days_nonrepeating.js", "08 Oct 2024 12:30:00 GMT-07:00", ["js/electron.js"], "America/Chicago");
			// just
			await expect(doTestTableContent(".calendar .event", ".time", "25th.Oct-30th.Oct", first)).resolves.toBe(true);
		});
	});

	describe("one event no end display", () => {
		it("don't display end", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/event_with_time_over_multiple_days_non_repeating_no_display_end.js", "08 Oct 2024 12:30:00 GMT-07:00", ["js/electron.js"], "America/Chicago");
			// just
			await expect(doTestTableContent(".calendar .event", ".time", "25th.Oct, 20:00", first)).resolves.toBe(true);
		});
	});

	describe("display end display end", () => {
		it("display end", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/event_with_time_over_multiple_days_non_repeating_display_end.js", "08 Oct 2024 12:30:00 GMT-07:00", ["js/electron.js"], "America/Chicago");
			// just
			await expect(doTestTableContent(".calendar .event", ".time", "25th.Oct, 20:00-26th.Oct, 06:00", first)).resolves.toBe(true);
		});
	});

});
