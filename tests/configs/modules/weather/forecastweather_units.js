/* Magic Mirror Test config default weather
 *
 * By rejas
 * MIT Licensed.
 */
let config = {
	units: "imperial",

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				type: "forecast",
				location: "Munich",
				apiKey: "fake key",
				weatherEndpoint: "/forecast/daily",
				initialLoadDelay: 3000,
				decimalSymbol: "_"
			}
		}
	]
};

config = Object.assign(require("../../default.js"), config);

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
