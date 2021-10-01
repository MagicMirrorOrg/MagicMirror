/* Magic Mirror Test config default weather
 *
 * By fewieden https://github.com/fewieden
 * MIT Licensed.
 */
let config = require(process.cwd() + "/tests/configs/default.js").configFactory({
	units: "imperial",

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				apiKey: "fake key",
				initialLoadDelay: 3000,
				decimalSymbol: ",",
				showHumidity: true
			}
		}
	]
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
