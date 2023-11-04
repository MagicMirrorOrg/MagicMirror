/* MagicMirror² Test calendar exdate
 *
 * By jkriegshauser
 * MIT Licensed.
 *
 * NOTE: calendar_test_exdate.ics has exdate entries for the next 20 years, but without some
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
						maximumNumberOfDays: 364,
						url: "http://localhost:8080/tests/mocks/calendar_test_exdate.ics"
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
