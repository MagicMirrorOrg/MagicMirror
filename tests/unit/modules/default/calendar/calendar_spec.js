global.moment = require("moment-timezone");

const defaults = require("../../../../../js/defaults");

describe("Calendar module", () => {
	let calendar;

	beforeAll(() => {
		const CalendarUtils = require(`../../../../../${defaults.defaultModulesDir}/calendar/calendarutils`);
		global.CalendarUtils = CalendarUtils;
		global.Module = {
			register: (name, moduleDefinition) => {
				calendar = moduleDefinition;
			}
		};
		require(`../../../../../${defaults.defaultModulesDir}/calendar/calendar`);
		moment.updateLocale("en", CalendarUtils.getLocaleSpecification(24));
	});

	afterAll(() => {
		moment.updateLocale("en", null);
	});

	describe("buildAbsoluteTimeText with dateFormatToday", () => {
		const buildTimeText = (config, { start = "2030-01-01T09:00:00", end = "2030-01-01T10:00:00", fullDayEvent = false } = {}) => {
			const now = moment("2030-01-01T08:00:00");
			const startMoment = moment(start);
			const endMoment = moment(end);
			const event = { today: startMoment.isSame(now, "d"), fullDayEvent, startDate: startMoment.format("x"), endDate: endMoment.format("x") };
			calendar.config = { ...calendar.defaults, timeFormat: "absolute", dateFormat: "dddd DD.MM. HH:mm", urgency: 0, getRelative: 0, ...config };
			return calendar.buildAbsoluteTimeText(event, startMoment, endMoment, now);
		};

		it("should use dateFormat when dateFormatToday is not set", () => {
			expect(buildTimeText({})).toBe("Tuesday 01.01. 09:00");
		});

		it("should use dateFormatToday for timed events today", () => {
			expect(buildTimeText({ dateFormatToday: "HH:mm" })).toBe("09:00");
		});

		it("should use dateFormat for events on other days", () => {
			expect(buildTimeText({ dateFormatToday: "HH:mm" }, { start: "2030-01-02T09:00:00", end: "2030-01-02T10:00:00" })).toBe("Wednesday 02.01. 09:00");
		});

		it("should not change full day events", () => {
			expect(buildTimeText({ dateFormatToday: "HH:mm", fullDayEventDateFormat: "DD.MM." }, { start: "2030-01-01T00:00:00", end: "2030-01-02T00:00:00", fullDayEvent: true })).toBe("01.01.");
		});

		it("should not repeat the start time with showEnd when dateFormatToday contains the time", () => {
			expect(buildTimeText({ dateFormatToday: "HH:mm", showEnd: true })).toBe("09:00-10:00");
		});

		it("should add the start time with showEnd when dateFormatToday has no time", () => {
			expect(buildTimeText({ dateFormatToday: "[Today]", showEnd: true })).toBe("Today, 09:00-10:00");
		});
	});
});
