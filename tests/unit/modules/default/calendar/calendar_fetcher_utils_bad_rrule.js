global.moment = require("moment-timezone");

const CalendarFetcherUtils = require("../../../../../modules/default/calendar/calendarfetcherutils");

describe("Calendar fetcher utils test", () => {
	const defaultConfig = {
		excludedEvents: []
	};

	describe("filterEvents", () => {
		it("no events, not crash", () => {
			const minusOneHour = moment().subtract(1, "hours").toDate();
			const minusTwoHours = moment().subtract(2, "hours").toDate();
			const plusOneHour = moment().add(1, "hours").toDate();
			const plusTwoHours = moment().add(2, "hours").toDate();

			const filteredEvents = CalendarFetcherUtils.filterEvents(
				{
					pastEvent: { type: "VEVENT", start: minusTwoHours, end: minusOneHour, summary: "pastEvent" },
					ongoingEvent: { type: "VEVENT", start: minusOneHour, end: plusOneHour, summary: "ongoingEvent" },
					upcomingEvent: { type: "VEVENT", start: plusOneHour, end: plusTwoHours, summary: "upcomingEvent" }
				},
				defaultConfig
			);

			expect(filteredEvents).toHaveLength(0);
		});
	});
});
