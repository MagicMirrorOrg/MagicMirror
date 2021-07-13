/* Magic Mirror Test config default weather
 *
 * By fewieden https://github.com/fewieden
 * MIT Licensed.
 */
let config = require(process.cwd() + "/tests/configs/default.js").configFactory({
	timeFormat: 12,

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
				showPrecipitationAmount: true,
				colored: true,
				tableClass: "myTableClass"
			}
		}
	]
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
