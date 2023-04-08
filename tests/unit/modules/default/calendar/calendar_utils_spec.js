const CalendarUtils = require("../../../../../modules/default/calendar/calendarutils");

describe("Calendar utils tests", () => {
	describe("capFirst", () => {
		it("should capitalize the first letter", () => {
			expect(CalendarUtils.capFirst("event")).toBe("Event");
		});
		it("should not capitalize other letters", () => {
			expect(CalendarUtils.capFirst("event")).not.toBe("EVent");
		});
	});

	describe("shorten", () => {
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
	});

	describe("titleTransform and shorten combined", () => {
		it("should replace the birthday and wrap nicely", () => {
			const transformedTitle = CalendarUtils.titleTransform("Michael Teeuw's birthday", {
				"De verjaardag van ": "",
				"'s birthday": ""
			});
			expect(CalendarUtils.shorten(transformedTitle, 10, true, 2)).toBe("Michael <br>Teeuw");
		});
	});
});
