let config = {
	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				hideDuplicates: false,
				maximumEntries: 100,
				sliceMultiDayEvents: true,
				calendars: [
					{
						maximumEntries: 100,
						url: "http://localhost:8080/tests/mocks/sliceMultiDayEvents.ics"
					}
				]
			}
		}
	]
};

Date.now = () => {
	return new Date("01 Sept 2024 10:38:00 GMT+2:00").valueOf();
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
