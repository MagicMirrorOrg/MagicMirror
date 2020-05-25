/* Magic Mirror Test calendar calendar
 *
 * This configuration is a wrong authentication
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */

var config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

	language: "en",
	timeFormat: 12,
	units: "metric",
	electronOptions: {
		webPreferences: {
			nodeIntegration: true
		}
	},

	modules: [
		{
			module: "calendar",
			position: "bottom_bar",
			config: {
				calendars: [
					{
						maximumNumberOfDays: 10000,
						url: "http://localhost:8020/tests/configs/data/calendar_test.ics",
						auth: {
							user: "MagicMirror",
							pass: "StairwayToHeaven",
							method: "basic"
						}
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
