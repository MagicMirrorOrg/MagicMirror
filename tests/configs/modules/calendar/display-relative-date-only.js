const config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,
	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				maximumNumberOfDays: 10000,
				forceUseCurrentTime: true,
				showEnd: true,
				displayEventDate: true,
				displayEventTime: false,
				timeFormat: "relative",
				calendars: [
					{
						url: "http://localhost:8080/tests/mocks/calendar_test.ics"
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
