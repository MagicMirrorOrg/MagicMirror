/* Magic Mirror Test config for position setters module
 *
 * For this case is using helloworld module
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */


var config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],
	ipWhitelist: [],

	language: "en",
	timeFormat: 24,
	units: "metric",
	electronOptions: {
		webPreferences: {
			nodeIntegration: true,
		},
	},
	modules:
		// Using exotic content. This is why dont accept go to JSON configuration file
		(function() {
			var positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third",
				"middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right",
				"bottom_bar", "fullscreen_above", "fullscreen_below"];
			var modules = Array();
			for (idx in positions) {
				modules.push({
					module: "helloworld",
					position: positions[idx],
					config: {
						text: "Text in " + positions[idx]
					}
				});
			}
			return modules;
		})(),
};
/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}
