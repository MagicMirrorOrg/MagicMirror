/* MagicMirror² Test config current weather compliments
 *
 * By rejas https://github.com/rejas
 * MIT Licensed.
 */
let config = {
	modules: [
		{
			module: "compliments",
			position: "top_bar",
			config: {
				compliments: {
					snow: ["snow"]
				},
				updateInterval: 3000
			}
		},
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				mockData: '"#####WEATHERDATA#####"'
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
