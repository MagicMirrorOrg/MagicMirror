global.moment = require("moment-timezone");

const CalendarFetcherUtils = require("../../../../../modules/default/calendar/calendarfetcherutils");

describe("Calendar fetcher utils test", () => {
	const defaultConfig = {
		excludedEvents: [],
		includePastEvents: false,
		maximumEntries: 10,
		maximumNumberOfDays: 365
	};
	describe("filterEvents", () => {
		it("should return only ongoing and upcoming non full day events", () => {
			const minusOneHour = moment().subtract(1, "hours").toDate();
			const minusTwoHours = moment().subtract(2, "hours").toDate();
			const plusOneHour = moment().add(1, "hours").toDate();
			const plusTwoHours = moment().add(2, "hours").toDate();

			const newEvents = CalendarFetcherUtils.filterEvents(
				{
					pastEvent: { type: "VEVENT", start: minusTwoHours, end: minusOneHour },
					ongoingEvent: { type: "VEVENT", start: minusOneHour, end: plusOneHour },
					upcomingEvent: { type: "VEVENT", start: plusOneHour, end: plusTwoHours }
				},
				defaultConfig
			);

			expect(newEvents.length).toEqual(2);
		});

		it("should return only ongoing and upcoming full day events", () => {
			const yesterday = moment().subtract(1, "days").startOf("day").toDate();
			const today = moment().startOf("day").toDate();
			const tomorrow = moment().add(1, "days").startOf("day").toDate();

			const newEvents = CalendarFetcherUtils.filterEvents(
				{
					pastEvent: { type: "VEVENT", start: yesterday, end: yesterday },
					ongoingEvent: { type: "VEVENT", start: today, end: today },
					upcomingEvent: { type: "VEVENT", start: tomorrow, end: tomorrow }
				},
				defaultConfig
			);

			expect(newEvents.length).toEqual(2);
		});
	});
});
