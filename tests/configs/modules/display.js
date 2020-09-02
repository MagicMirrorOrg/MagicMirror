/* Magic Mirror Test config for display setters module using the helloworld module
 *
 * MIT Licensed.
 */
var config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

	language: "en",
	timeFormat: 24,
	units: "metric",
	electronOptions: {
		fullscreen: false,
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		}
	},

	modules: [
		{
			module: "helloworld",
			position: "top_bar",
			header: "test_header",
			config: {
				text: "Test Display Header"
			}
		},
		{
			module: "helloworld",
			position: "bottom_bar",
			config: {
				text: "Test Hide Header"
			}
		}
	]
};
/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
