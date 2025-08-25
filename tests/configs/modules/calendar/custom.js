let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				customEvents: [{ keyword: "CustomEvent", symbol: "dice", eventClass: "undo" }],
				forceUseCurrentTime: true,
				calendars: [
					{
						maximumEntries: 5,
						pastDaysCount: 5,
						broadcastPastEvents: true,
						maximumNumberOfDays: 10000,
						symbol: "birthday-cake",
						fullDaySymbol: "calendar-day",
						recurringSymbol: "undo",
						url: "http://localhost:8080/tests/mocks/calendar_test_icons.ics"
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
