/* MagicMirror² Test config custom calendar
 *
 * By Rejas
 * MIT Licensed.
 */
let config = {
	timeFormat: 12,

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				calendars: [
					{
						maximumEntries: 6,
						maximumNumberOfDays: 3650,
						url: "http://localhost:8080/tests/configs/data/calendar_test_recurring.ics"
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
