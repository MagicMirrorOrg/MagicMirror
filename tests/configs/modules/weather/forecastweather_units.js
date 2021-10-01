/* Magic Mirror Test config default weather
 *
 * By rejas
 * MIT Licensed.
 */
let config = require(process.cwd() + "/tests/configs/default.js").configFactory({
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
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
