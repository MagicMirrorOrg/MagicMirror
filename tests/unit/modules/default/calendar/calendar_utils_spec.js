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
});
