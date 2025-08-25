/*
 * MagicMirror² Test calendar exdate
 *
 * By jkriegshauser
 * MIT Licensed.
 *
 * See issue #3250
 * See tests/electron/modules/calendar_spec.js
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
				maximumEntries: 100,
				calendars: [
					{
						maximumEntries: 100,
						maximumNumberOfDays: 28, // 4 weeks, 2 of which are skipped
						url: "http://localhost:8080/tests/mocks/exdate_la_before_midnight.ics"
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
