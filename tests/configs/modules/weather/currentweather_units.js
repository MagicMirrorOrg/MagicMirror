/* MagicMirror² Test config default weather
 *
 * By fewieden https://github.com/fewieden
 * MIT Licensed.
 */
let config = {
	units: "imperial",

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				mockData: '"#####WEATHERDATA#####"',
				decimalSymbol: ",",
				showHumidity: true
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
