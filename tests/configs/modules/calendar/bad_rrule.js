/* MagicMirror² Test ics with out of date event causing bad return from rrule.between
 *
 * By Sam Detweiler
 * MIT Licensed.
 */
let config = {
	timeFormat: 12,
	logLevel: ["INFO", "LOG", "WARN", "ERROR", "DEBUG"],
	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				calendars: [
					{
						url: "http://localhost:8080/tests/mocks/bad_rrule.ics"
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
