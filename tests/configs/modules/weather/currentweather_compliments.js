/* Magic Mirror Test config current weather compliments
 *
 * By rejas https://github.com/rejas
 * MIT Licensed.
 */
let config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

	language: "en",
	timeFormat: 24,
	units: "metric",
	electronOptions: {
		fullscreen: false,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true
		}
	},

	modules: [
		{
			module: "compliments",
			position: "top_bar",
			config: {
				compliments: {
					snow: ["snow"]
				},
				updateInterval: 4000
			}
		},
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				apiKey: "fake key",
				initialLoadDelay: 3000
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
