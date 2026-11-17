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
				fullDayEventDateFormat: "YYYY-MM-DD",
				timeFormat: "dateheaders",
				calendars: [
					{
						url: "http://localhost:8080/tests/mocks/calendar_display_dateheaders_multiday_allday.ics"
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
