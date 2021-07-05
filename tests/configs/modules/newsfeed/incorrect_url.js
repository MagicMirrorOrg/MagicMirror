/* Magic Mirror Test config newsfeed module
 *
 * MIT Licensed.
 */
const configFactory = require('../../default.js')

const config = configFacory({
	timeFormat: 12,

	modules: [
		{
			module: "newsfeed",
			position: "bottom_bar",
			config: {
				feeds: [
					{
						title: "Incorrect Url",
						url: "this is not a valid url"
					}
				]
			}
		}
	]
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
