let config = {
	address: "0.0.0.0",
	ipWhitelist: [],

	timeFormat: 24,
	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				fade: false,
				urgency: 0,
				dateFormat: "Do.MMM, HH:mm",
				fullDayEventDateFormat: "Do.MMM",
				timeFormat: "absolute",
				getRelative: 0,
				maximumNumberOfDays: 20,
				calendars: [
					{
						maximumEntries: 100,
						//url: "http://localhost:8080/tests/mocks/chicago_late_in_timezone.ics"
						url: "http://localhost:8080/tests/mocks/chicago_late_in_timezone.ics"
					}
				]
			}
		}
	]
};

Date.now = () => {
	return new Date("01 Sept 2024 10:38:00 GMT-05:00").valueOf();
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}