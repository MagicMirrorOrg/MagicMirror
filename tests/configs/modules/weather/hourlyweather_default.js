/* MagicMirror² Test config hourly weather
 *
 * By rejas https://github.com/rejas
 * MIT Licensed.
 */
let config = {
	timeFormat: 12,

	modules: [
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				type: "hourly",
				location: "Berlin",
				mockData: '"#####WEATHERDATA#####"'
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
