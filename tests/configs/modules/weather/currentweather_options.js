/* Magic Mirror Test config default weather
 *
 * By fewieden https://github.com/fewieden
 * MIT Licensed.
 */
const configFactory = require("../../default.js");

const config = configFacory({
	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				apiKey: "fake key",
				initialLoadDelay: 3000,
				useBeaufort: false,
				showWindDirectionAsArrow: true,
				showSun: false,
				showHumidity: true,
				roundTemp: true,
				degreeLabel: true
			}
		}
	]
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
