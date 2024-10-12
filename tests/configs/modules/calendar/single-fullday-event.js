/*
 * MagicMirror² Test config for fullday calendar entries over multiple days
 *
 * By Paranoid93 https://github.com/Paranoid93/
 * MIT Licensed.
 */
let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				calendars: [
					{
						maximumNumberOfDays: 2,
						url: "http://localhost:8080/tests/mocks/calendar_test_full_day_events.ics"
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
