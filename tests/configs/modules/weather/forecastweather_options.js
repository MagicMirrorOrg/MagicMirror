/* MagicMirror² Test config default weather
 *
 * By fewieden https://github.com/fewieden
 * MIT Licensed.
 */
let config = {
	timeFormat: 12,

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				type: "forecast",
				location: "Munich",
				mockData: '"#####WEATHERDATA#####"',
				weatherEndpoint: "/forecast/daily",
				showPrecipitationAmount: true,
				colored: true,
				tableClass: "myTableClass"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
