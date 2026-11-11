import moment from "moment-timezone";
import CalendarUtils from "../../../../../defaultmodules/calendar/calendarutils.mjs";

globalThis.moment = moment;

describe("Calendar utils tests", () => {
	describe("capFirst", () => {
		const words = {
			rodrigo: "Rodrigo",
			"123m": "123m",
			"magic mirror": "Magic mirror",
			",a": ",a",
			ñandú: "Ñandú"
		};

		Object.keys(words).forEach((word) => {
			it(`for '${word}' should return '${words[word]}'`, () => {
				expect(CalendarUtils.capFirst(word)).toBe(words[word]);
			});
		});

		it("should not capitalize other letters", () => {
			expect(CalendarUtils.capFirst("event")).not.toBe("EVent");
		});
	});

	describe("getLocaleSpecification", () => {
		it("should return a valid moment.LocaleSpecification for a 12-hour format", () => {
			expect(CalendarUtils.getLocaleSpecification(12)).toEqual({ longDateFormat: { LT: "h:mm A" } });
		});

		it("should return a valid moment.LocaleSpecification for a 24-hour format", () => {
			expect(CalendarUtils.getLocaleSpecification(24)).toEqual({ longDateFormat: { LT: "HH:mm" } });
		});

		it("should return the current system locale when called without timeFormat number", () => {
			expect(CalendarUtils.getLocaleSpecification()).toEqual({ longDateFormat: { LT: moment.localeData().longDateFormat("LT") } });
		});

		it("should return a 12-hour longDateFormat when using the 'en' locale", () => {
			const localeBackup = moment.locale();
			moment.locale("en");
			expect(CalendarUtils.getLocaleSpecification()).toEqual({ longDateFormat: { LT: "h:mm A" } });
			moment.locale(localeBackup);
		});

		it("should return a 12-hour longDateFormat when using the 'au' locale", () => {
			const localeBackup = moment.locale();
			moment.locale("au");
			expect(CalendarUtils.getLocaleSpecification()).toEqual({ longDateFormat: { LT: "h:mm A" } });
			moment.locale(localeBackup);
		});

		it("should return a 12-hour longDateFormat when using the 'eg' locale", () => {
			const localeBackup = moment.locale();
			moment.locale("eg");
			expect(CalendarUtils.getLocaleSpecification()).toEqual({ longDateFormat: { LT: "h:mm A" } });
			moment.locale(localeBackup);
		});

		it("should return a 24-hour longDateFormat when using the 'nl' locale", () => {
			const localeBackup = moment.locale();
			moment.locale("nl");
			expect(CalendarUtils.getLocaleSpecification()).toEqual({ longDateFormat: { LT: "HH:mm" } });
			moment.locale(localeBackup);
		});

		it("should return a 24-hour longDateFormat when using the 'fr' locale", () => {
			const localeBackup = moment.locale();
			moment.locale("fr");
			expect(CalendarUtils.getLocaleSpecification()).toEqual({ longDateFormat: { LT: "HH:mm" } });
			moment.locale(localeBackup);
		});

		it("should return a 24-hour longDateFormat when using the 'uk' locale", () => {
			const localeBackup = moment.locale();
			moment.locale("uk");
			expect(CalendarUtils.getLocaleSpecification()).toEqual({ longDateFormat: { LT: "HH:mm" } });
			moment.locale(localeBackup);
		});
	});

	describe("shorten", () => {
		it("should escape HTML", () => {
			expect(CalendarUtils.shorten("<img src=x onerror=alert(1)>", 100, false, 3)).toBe("&lt;img src=x onerror=alert(1)&gt;");
		});

		it("should not shorten if short enough", () => {
			expect(CalendarUtils.shorten("Event 1", 10, false, 1)).toBe("Event 1");
		});

		it("should shorten into one line", () => {
			expect(CalendarUtils.shorten("Example event at 12 o clock", 10, true, 1)).toBe("Example …");
		});

		it("should shorten into three lines", () => {
			expect(CalendarUtils.shorten("Example event at 12 o clock", 10, true, 3)).toBe("Example <br>event at 12 o <br>clock");
		});

		it("should not shorten into three lines if wrap is false", () => {
			expect(CalendarUtils.shorten("Example event at 12 o clock", 10, false, 3)).toBe("Example ev…");
		});

		const strings = {
			" String with whitespace at the beginning that needs trimming": { length: 16, return: "String with whit…" },
			"long string that needs shortening": { length: 16, return: "long string that…" },
			"short string": { length: 16, return: "short string" },
			"long string with no maxLength defined": { return: "long string with no maxLength defined" }
		};

		Object.keys(strings).forEach((string) => {
			it(`for '${string}' should return '${strings[string].return}'`, () => {
				expect(CalendarUtils.shorten(string, strings[string].length)).toBe(strings[string].return);
			});
		});

		it("should return an empty string if shorten is called with a non-string", () => {
			expect(CalendarUtils.shorten(100)).toBe("");
		});

		it("should not shorten the string if shorten is called with a non-number maxLength", () => {
			expect(CalendarUtils.shorten("This is a test string", "This is not a number")).toBe("This is a test string");
		});

		it("should wrap the string instead of shorten it if shorten is called with wrapEvents = true (with maxLength defined as 20)", () => {
			expect(CalendarUtils.shorten("This is a wrapEvent test. Should wrap the string instead of shorten it if called with wrapEvent = true", 20, true)).toBe(
				"This is a <br>wrapEvent test. Should wrap <br>the string instead of <br>shorten it if called with <br>wrapEvent = true"
			);
		});

		it("should wrap the string instead of shorten it if shorten is called with wrapEvents = true (without maxLength defined, default 25)", () => {
			expect(CalendarUtils.shorten("This is a wrapEvent test. Should wrap the string instead of shorten it if called with wrapEvent = true", undefined, true)).toBe(
				"This is a wrapEvent <br>test. Should wrap the string <br>instead of shorten it if called <br>with wrapEvent = true"
			);
		});

		it("should wrap and shorten the string in the second line if called with wrapEvents = true and maxTitleLines = 2", () => {
			expect(CalendarUtils.shorten("This is a wrapEvent and maxTitleLines test. Should wrap and shorten the string in the second line if called with wrapEvents = true and maxTitleLines = 2", undefined, true, 2)).toBe(
				"This is a wrapEvent and <br>maxTitleLines test. Should wrap and …"
			);
		});
	});

	describe("titleTransform and shorten combined", () => {
		it("should replace the birthday and wrap nicely", () => {
			const transformedTitle = CalendarUtils.titleTransform("Michael Teeuw's birthday", [{ search: "'s birthday", replace: "" }]);
			expect(CalendarUtils.shorten(transformedTitle, 10, true, 2)).toBe("Michael <br>Teeuw");
		});
	});

	describe("titleTransform with yearmatchgroup", () => {
		it("should replace the birthday and wrap nicely", () => {
			const transformedTitle = CalendarUtils.titleTransform("Luciella '2000", [{ search: "^([^']*) '(\\d{4})$", replace: "$1 ($2.)", yearmatchgroup: 2 }]);
			const expectedResult = `Luciella (${new Date().getFullYear() - 2000}.)`;
			expect(transformedTitle).toBe(expectedResult);
		});

		it("should not fail when the yearmatchgroup regex does not match", () => {
			const transformedTitle = CalendarUtils.titleTransform("Test Birthday", [{ search: "^(.+) \\((\\d{4})\\)$", replace: "$1 ($2)", yearmatchgroup: 2 }]);
			expect(transformedTitle).toBe("Test Birthday");
		});
	});

	describe("time text", () => {
		const now = moment("2030-01-01T12:00:00Z").utc();
		const translations = {
			TODAY: "Today",
			TOMORROW: "Tomorrow",
			YESTERDAY: "Yesterday",
			DAYAFTERTOMORROW: "DAYAFTERTOMORROW",
			DAYBEFOREYESTERDAY: "DAYBEFOREYESTERDAY",
			RUNNING: "Running"
		};
		const translate = (key, variables) => (variables?.fallback ? `${translations[key]} ${variables.timeUntilEnd}` : translations[key]);
		const baseConfig = {
			dateFormat: "MMM Do",
			dateEndFormat: "LT",
			fullDayEventDateFormat: "MMM Do",
			showEnd: false,
			showEndsOnlyWithDuration: false,
			hideTime: false,
			showTimeToday: false,
			nextDaysRelative: false,
			getRelative: 6,
			urgency: 7
		};
		const makeEvent = (start, end, extra = {}) => ({
			startDate: start.format("x"),
			endDate: end.format("x"),
			fullDayEvent: false,
			...extra
		});

		beforeEach(() => {
			globalThis.Log = { debug () {}, info () {} };
			// moment's fromNow() reads the system clock, not the `now` argument
			vi.useFakeTimers({ toFake: ["Date"] });
			vi.setSystemTime(now.toDate());
		});

		afterEach(() => {
			vi.useRealTimers();
			Reflect.deleteProperty(globalThis, "Log");
		});

		describe("dateFormatIncludesTime", () => {
			it("detects time tokens, also via locale tokens", () => {
				expect(CalendarUtils.dateFormatIncludesTime("MMM Do, HH:mm")).toBe(true);
				expect(CalendarUtils.dateFormatIncludesTime("lll")).toBe(true);
			});

			it("ignores literals and date-only formats", () => {
				expect(CalendarUtils.dateFormatIncludesTime("MMM Do")).toBe(false);
				expect(CalendarUtils.dateFormatIncludesTime("[at] MMM Do")).toBe(false);
			});
		});

		describe("formatTimedEventEnd", () => {
			it("uses time only on the same day and dateEndFormat otherwise", () => {
				const start = now.clone();
				expect(CalendarUtils.formatTimedEventEnd(start, start.clone().add(1, "hour"), "MMM Do")).toBe(start.clone().add(1, "hour").format("LT"));
				expect(CalendarUtils.formatTimedEventEnd(start, start.clone().add(1, "day"), "MMM Do")).toBe("Jan 2nd");
			});
		});

		describe("buildRelativeTimeText", () => {
			it("shows 'Running' for ongoing events", () => {
				const start = now.clone().subtract(1, "hour");
				const end = now.clone().add(1, "hour");
				expect(CalendarUtils.buildRelativeTimeText(makeEvent(start, end), start, end, now, baseConfig, translate)).toBe("Running an hour");
			});

			it("shows a relative time within getRelative hours", () => {
				const start = now.clone().add(2, "hours");
				const end = now.clone().add(3, "hours");
				expect(CalendarUtils.buildRelativeTimeText(makeEvent(start, end), start, end, now, baseConfig, translate)).toBe("In 2 hours");
			});

			it("appends the end time for same-day timed events beyond getRelative", () => {
				const start = now.clone().add(8, "hours");
				const end = now.clone().add(9, "hours");
				const text = CalendarUtils.buildRelativeTimeText(makeEvent(start, end), start, end, now, { ...baseConfig, showEnd: true }, translate);
				expect(text).toContain(`-${end.format("LT")}`);
			});

			it("hideTime overrides showEnd for timed events", () => {
				const start = now.clone().add(8, "hours");
				const end = now.clone().add(9, "hours");
				const text = CalendarUtils.buildRelativeTimeText(makeEvent(start, end), start, end, now, { ...baseConfig, showEnd: true, hideTime: true }, translate);
				expect(text).not.toContain("-");
			});

			it("shows 'Today' for full-day events today and the end date for multi-day ones", () => {
				const start = now.clone().startOf("day");
				const end = start.clone().add(1, "day");
				const event = makeEvent(start, end, { fullDayEvent: true, today: true });
				expect(CalendarUtils.buildRelativeTimeText(event, start, end, now, baseConfig, translate)).toBe("Today");

				// a multi-day event starting later today shows the range end
				const laterStart = now.clone().add(1, "hour");
				const multiDayEnd = start.clone().add(3, "days");
				const multiDay = makeEvent(laterStart, multiDayEnd, { fullDayEvent: true, today: true });
				expect(CalendarUtils.buildRelativeTimeText(multiDay, laterStart, multiDayEnd, now, { ...baseConfig, showEnd: true }, translate)).toBe("Today-Jan 3rd");
			});

			it("skips untranslated day-after-tomorrow label", () => {
				const start = now.clone().add(2, "days").startOf("day");
				const end = start.clone().add(1, "day");
				const event = makeEvent(start, end, { fullDayEvent: true, dayAfterTomorrow: true });
				expect(CalendarUtils.buildRelativeTimeText(event, start, end, now, baseConfig, translate)).toBe("Thursday");
			});
		});

		describe("buildAbsoluteTimeText", () => {
			it("shows the formatted start date for events beyond urgency", () => {
				const start = now.clone().add(30, "days");
				const end = start.clone().add(1, "hour");
				expect(CalendarUtils.buildAbsoluteTimeText(makeEvent(start, end), start, end, now, baseConfig, translate)).toBe("Jan 31st");
			});

			it("adds start time and end time on the same day when the format has no time", () => {
				const start = now.clone().add(30, "days");
				const end = start.clone().add(1, "hour");
				const text = CalendarUtils.buildAbsoluteTimeText(makeEvent(start, end), start, end, now, { ...baseConfig, showEnd: true }, translate);
				expect(text).toBe(`Jan 31st, ${start.format("LT")}-${end.format("LT")}`);
			});

			it("omits the end when showEndsOnlyWithDuration is set and the event has no duration", () => {
				const start = now.clone().add(30, "days");
				const text = CalendarUtils.buildAbsoluteTimeText(makeEvent(start, start), start, start, now, { ...baseConfig, showEnd: true, showEndsOnlyWithDuration: true }, translate);
				expect(text).toBe("Jan 31st");
			});

			it("shows 'Running' for ongoing timed events and relative text when urgent", () => {
				const runningStart = now.clone().subtract(1, "hour");
				const runningEnd = now.clone().add(1, "hour");
				expect(CalendarUtils.buildAbsoluteTimeText(makeEvent(runningStart, runningEnd), runningStart, runningEnd, now, baseConfig, translate)).toBe("Running an hour");

				const start = now.clone().add(2, "days");
				const end = start.clone().add(1, "hour");
				expect(CalendarUtils.buildAbsoluteTimeText(makeEvent(start, end), start, end, now, { ...baseConfig, getRelative: 0 }, translate)).toBe("In 2 days");
			});

			it("shows the full-day range and relative labels", () => {
				const start = now.clone().add(30, "days").startOf("day");
				const end = start.clone().add(2, "days");
				const event = makeEvent(start, end, { fullDayEvent: true });
				expect(CalendarUtils.buildAbsoluteTimeText(event, start, end, now, { ...baseConfig, showEnd: true }, translate)).toBe("Jan 31st-Feb 1st");

				const today = now.clone().startOf("day");
				const todayEnd = today.clone().add(1, "day");
				const todayEvent = makeEvent(today, todayEnd, { fullDayEvent: true, today: true });
				expect(CalendarUtils.buildAbsoluteTimeText(todayEvent, today, todayEnd, now, { ...baseConfig, nextDaysRelative: true }, translate)).toBe("Today");
			});
		});
	});

	describe("showEnd time text (America/Chicago, 24h)", () => {
		const zone = "America/Chicago";
		const at = (value) => moment.tz(value, zone);
		const translations = { TODAY: "Today", TOMORROW: "Tomorrow" };
		const translate = (key) => translations[key] ?? key;
		const config = (overrides) => ({
			dateFormat: "Do.MMM",
			dateEndFormat: "Do.MMM, HH:mm",
			fullDayEventDateFormat: "Do.MMM",
			showEnd: true,
			showEndsOnlyWithDuration: false,
			hideTime: false,
			nextDaysRelative: false,
			getRelative: 0,
			urgency: 0,
			...overrides
		});
		const timedMultiDay = { start: at("2024-10-26T01:00:00Z"), end: at("2024-10-26T11:00:00Z") };
		const timedSameDay = { start: at("2024-10-25T20:00:00"), end: at("2024-10-25T22:00:00") };
		const timedNoDuration = { start: at("2024-10-25T20:00:00"), end: at("2024-10-25T20:00:00") };
		const fullDayMultiDay = { start: at("2024-10-25T00:00:00"), end: at("2024-10-31T00:00:00"), fullDayEvent: true };
		let originalEnglishTimeFormat;
		const run = (build, { start: rawStart, end: rawEnd, fullDayEvent = false }, cfg, nowText = "2024-10-08T19:30:00Z", flags = {}) => {
			vi.setSystemTime(new Date(nowText));
			// fixtures are created before updateLocale(), and moments keep the locale object they were created with
			const start = rawStart.clone().locale("en");
			const end = rawEnd.clone().locale("en");
			const event = { startDate: start.format("x"), endDate: end.format("x"), fullDayEvent, ...flags };
			return CalendarUtils[build](event, start, end, moment(), cfg, translate);
		};

		beforeEach(() => {
			globalThis.Log = { debug () {}, info () {} };
			originalEnglishTimeFormat = moment.localeData("en").longDateFormat("LT");
			moment.updateLocale("en", { longDateFormat: { LT: "HH:mm" } });
			vi.useFakeTimers({ toFake: ["Date"] });
		});

		afterEach(() => {
			vi.useRealTimers();
			moment.updateLocale("en", { longDateFormat: { LT: originalEnglishTimeFormat } });
			Reflect.deleteProperty(globalThis, "Log");
		});

		it.each([
			["absolute timed multi-day: display end", "buildAbsoluteTimeText", timedMultiDay, { dateFormat: "Do.MMM, HH:mm" }, "25th.Oct, 20:00-26th.Oct, 06:00"],
			["relative timed multi-day: display end", "buildRelativeTimeText", timedMultiDay, { dateFormat: "Do.MMM, HH:mm" }, "25th.Oct, 20:00-26th.Oct, 06:00"],
			// the event has a duration, so showEndsOnlyWithDuration still shows the end
			["absolute timed multi-day: showEndsOnlyWithDuration with real duration", "buildAbsoluteTimeText", timedMultiDay, { dateFormat: "Do.MMM, HH:mm", showEndsOnlyWithDuration: true }, "25th.Oct, 20:00-26th.Oct, 06:00"],
			["absolute timed: showEndsOnlyWithDuration without duration hides the end", "buildAbsoluteTimeText", timedNoDuration, { dateFormat: "Do.MMM, HH:mm", showEndsOnlyWithDuration: true }, "25th.Oct, 20:00"],
			["relative timed: showEndsOnlyWithDuration without duration hides the end", "buildRelativeTimeText", timedNoDuration, { dateFormat: "Do.MMM, HH:mm", showEndsOnlyWithDuration: true }, "25th.Oct, 20:00"],
			["absolute same-day: start and end without repeating date", "buildAbsoluteTimeText", timedSameDay, {}, "25th.Oct, 20:00-22:00"],
			["absolute same-day: time already in dateFormat", "buildAbsoluteTimeText", timedSameDay, { dateFormat: "Do.MMM, HH:mm" }, "25th.Oct, 20:00-22:00"],
			["relative same-day: start and end without repeating date", "buildRelativeTimeText", timedSameDay, {}, "25th.Oct, 20:00-22:00"],
			["relative same-day: hideTime shows no times", "buildRelativeTimeText", timedSameDay, { hideTime: true }, "25th.Oct"],
			["relative multi-day full-day: start and end date", "buildRelativeTimeText", fullDayMultiDay, {}, "25th.Oct-30th.Oct"]
		])("%s", (name, build, event, overrides, expected) => {
			expect(run(build, event, config(overrides))).toBe(expected);
		});

		it("absolute same-day: dateFormat LLL does not duplicate the start time", () => {
			const text = run("buildAbsoluteTimeText", timedSameDay, config({ dateFormat: "LLL" }));
			expect(text.match(/\d{1,2}:\d{2}(?:\s?[AP]M)?/gi)).toHaveLength(2);
			expect(text).toContain("-");
		});

		it("absolute multi-day full-day with nextDaysRelative: relative label and end date", () => {
			const text = run("buildAbsoluteTimeText", fullDayMultiDay, config({ nextDaysRelative: true }), "2024-10-24T19:30:00Z", { tomorrow: true });
			expect(text).toBe("Tomorrow-30th.Oct");
		});
	});
});
