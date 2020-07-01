/* Magic Mirror Test config compliments with date type
 *
 * By Rejas
 *
 * MIT Licensed.
 */

let config = {
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
			module: "compliments",
			position: "middle_center",
			config: {
				mockDate: "2020-01-01",
				compliments: {
					morning: [],
					afternoon: [],
					evening: [],
					"....-01-01": ["Happy new year!"]
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
