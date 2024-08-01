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
						url: "http://localhost:8080/tests/mocks/exdate_syd_at_midnight_std.ics"
					}
				]
			}
		}
	]
};

Date.now = () => {
	return new Date("14 Sep 2023 12:30:00 GMT+10:00").valueOf();
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
