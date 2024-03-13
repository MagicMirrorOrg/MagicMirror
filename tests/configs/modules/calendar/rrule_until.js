let config = {
	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				hideDuplicates: false,
				maximumEntries: 100,
				calendars: [
					{
						maximumEntries: 100,
						maximumNumberOfDays: 1, // Just today
						url: "http://localhost:8080/tests/mocks/rrule_until.ics"
					}
				]
			}
		}
	]
};

Date.now = () => {
	return new Date("07 Mar 2024 10:38:00 GMT-07:00").valueOf();
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
