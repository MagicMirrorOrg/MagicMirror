let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				calendars: [
					{
						maximumNumberOfDays: 10000,
						url: "http://localhost:8080/tests/mocks/calendar_test.ics",
						auth: {
							user: "MagicMirror",
							pass: "CallMeADog"
						}
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
