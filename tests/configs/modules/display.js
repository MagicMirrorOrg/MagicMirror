/* Magic Mirror Test config for display setters module using the helloworld module
 *
 * By Rejas
 * MIT Licensed.
 */
const configFactory = require('../default.js')

let config = configFacory({
	modules: [
		{
			module: "helloworld",
			position: "top_bar",
			header: "test_header",
			config: {
				text: "Test Display Header"
			}
		},
		{
			module: "helloworld",
			position: "bottom_bar",
			config: {
				text: "Test Hide Header"
			}
		}
	]
});

config.electronOptions.fullscreen = false;
config.electronOptions.width = 800;
config.electronOptions.height = 600;

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
