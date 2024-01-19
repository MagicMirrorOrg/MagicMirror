/* NOTE: calendar_test_exdate.ics has exdate entries for the next 20 years, but without some
 * way to set a debug date for tests, this test may become flaky on specific days (i.e. could
 * not test easily on leap-years, the BYDAY specified in exdate, etc.) or when the 20 years
 * elapses if this project is still in active development ;)
 * See issue #3250
 */
let config = {
	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				maximumEntries: 100,
				calendars: [
					{
						maximumEntries: 100,
						maximumNumberOfDays: 28, // 4 weeks, 2 of which are skipped
						url: "http://localhost:8080/tests/mocks/exdate_la_at_midnight_dst.ics"
					}
				]
			}
		}
	]
};

Date.now = () => {
	return new Date("19 Oct 2023 12:30:00 GMT-07:00").valueOf();
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
