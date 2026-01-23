global.moment = require("moment-timezone");

const defaults = require("../../../js/defaults");

const CalendarFetcherUtils = require(`../../../../../${defaults.defaultModulesDir}/calendar/calendarfetcherutils`);

describe("Calendar fetcher utils test", () => {
	const defaultConfig = {
		excludedEvents: []
	};

	describe("filterEvents", () => {
		it("no events, not crash", () => {
			const base = moment().startOf("day").add(12, "hours");
			const minusOneHour = base.clone().subtract(1, "hours").toDate();
			const minusTwoHours = base.clone().subtract(2, "hours").toDate();
			const plusOneHour = base.clone().add(1, "hours").toDate();
			const plusTwoHours = base.clone().add(2, "hours").toDate();

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
