/* MagicMirror² Test config default weather
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
				mockData: '"#####WEATHERDATA#####"',
				weatherEndpoint: "/forecast/daily",
				decimalSymbol: "_"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
