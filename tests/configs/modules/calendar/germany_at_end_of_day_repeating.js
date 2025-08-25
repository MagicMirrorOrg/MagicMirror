let config = {
	address: "0.0.0.0",
	ipWhitelist: [],

	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				hideDuplicates: false,
				maximumEntries: 100,
				sliceMultiDayEvents: true,
				dateFormat: "MMM Do, HH:mm",
				timeFormat: "absolute",
				getRelative: 0,
				urgency: 0,
				calendars: [
					{
						maximumEntries: 100,
						url: "http://localhost:8080/tests/mocks/germany_at_end_of_day_repeating.ics"
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
