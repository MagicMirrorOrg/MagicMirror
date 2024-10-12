let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				maximumEntries: 30,
				hideDuplicates: false,
				calendars: [
					{
						maximumEntries: 15,
						maximumNumberOfDays: 10000,
						url: "http://localhost:8080/tests/mocks/calendar_test.ics" // contains 11 events
					},
					{
						maximumEntries: 15,
						maximumNumberOfDays: 10000,
						url: "http://localhost:8080/tests/mocks/calendar_test_clone.ics" // clone of upper calendar
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
