let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				fade: false,
				urgency: 0,
				dateFormat: "Do.MMM, HH:mm",
				dateEndFormat: "Do.MMM, HH:mm",
				fullDayEventDateFormat: "Do.MMM",
				timeFormat: "absolute",
				getRelative: 0,
				maximumNumberOfDays: 28,
				showEndsOnlyWithDuration: false,
				showEnd: true,
				calendars: [
					{
						maximumEntries: 15,
						maximumNumberOfDays: 10000,
						url: "http://localhost:8080/tests/mocks/event_with_time_over_multiple_days_non_repeating.ics" // contains 11 events
					}
				]
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
