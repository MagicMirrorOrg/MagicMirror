/* Magic Mirror Test config current weather compliments
 *
 * By rejas https://github.com/rejas
 * MIT Licensed.
 */
let config = require(process.cwd() + "/tests/configs/default.js").configFactory({
	modules: [
		{
			module: "compliments",
			position: "top_bar",
			config: {
				compliments: {
					snow: ["snow"]
				},
				updateInterval: 4000
			}
		},
		{
			module: "weather",
			position: "bottom_bar",
			config: {
				location: "Munich",
				apiKey: "fake key",
				initialLoadDelay: 3000
			}
		}
	]
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
