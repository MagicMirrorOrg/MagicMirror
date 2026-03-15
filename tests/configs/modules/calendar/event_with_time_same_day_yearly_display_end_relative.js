const config = {
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
				dateFormat: "Do.MMM",
				dateEndFormat: "Do.MMM, HH:mm",
				fullDayEventDateFormat: "Do.MMM",
				timeFormat: "relative",
				getRelative: 0,
				showEnd: true,
				calendars: [
					{
						maximumEntries: 100,
						url: "http://localhost:8080/tests/mocks/event_with_time_same_day_yearly.ics"
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
