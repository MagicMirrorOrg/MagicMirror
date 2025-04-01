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
				maximumNumberOfDays: 28,
				showEnd: true,
				calendars: [
					{
						maximumEntries: 100,
						url: "http://localhost:8080/tests/mocks/chicago-nyedge.ics"
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
