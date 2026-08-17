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
				dateFormat: "Do.MMM, HH:mm",
				fullDayEventDateFormat: "Do.MMM",
				timeFormat: "absolute",
				getRelative: 0,
				maximumEntries: 100,
				showEnd: true,
				sliceMultiDayEvents: true,
				calendars: [
					{
						maximumEntries: 100,
						url: "http://localhost:8080/tests/mocks/calendar_test_slice_multiday_ends_midnight.ics"
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
