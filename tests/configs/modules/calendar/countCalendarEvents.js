let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,
	foreignModulesDir: "tests/mocks",
	modules: [
		{
			module: "calendar",
			position: "bottom_bar",

			config: {
				maximumEntries: 1,
				calendars: [
					{
						fetchInterval: 10000, //7 * 24 * 60 * 60 * 1000,
						symbol: ["calendar-check", "google"],
						url: "http://localhost:8080/tests/mocks/12_events.ics"
					}
				]
			}
		},
		{
			module: "testNotification",
			position: "bottom_bar",
			config: {
				debug: true,
				match: {
					matchtype: "count",
					notificationID: "CALENDAR_EVENTS"
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
