/* global mmPort */

/* MagicMirror²
 * Config Defaults
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
const address = "localhost";
let port = 8080;
if (typeof mmPort !== "undefined") {
	port = mmPort;
}
const defaults = {
	address: address,
	port: port,
	basePath: "/",
	kioskmode: false,
	electronOptions: {},
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

	language: "en",
	logLevel: ["INFO", "LOG", "WARN", "ERROR"],
	timeFormat: 24,
	units: "metric",
	zoom: 1,
	customCss: "css/custom.css",

	modules: [
		{
			module: "updatenotification",
			position: "top_center"
		},
		{
			module: "helloworld",
			position: "upper_third",
			classes: "large thin",
			config: {
				text: "MagicMirror²"
			}
		},
		{
			module: "helloworld",
			position: "middle_center",
			config: {
				text: "Please create a config file or check the existing one for errors."
			}
		},
		{
			module: "helloworld",
			position: "middle_center",
			classes: "small dimmed",
			config: {
				text: "See README for more information."
			}
		},
		{
			module: "helloworld",
			position: "middle_center",
			classes: "xsmall",
			config: {
				text: "If you get this message while your config file is already created,<br>" + "it probably contains an error. To validate your config file run in your MagicMirror² directory<br>" + "<pre>npm run config:check</pre>"
			}
		},
		{
			module: "helloworld",
			position: "bottom_bar",
			classes: "xsmall dimmed",
			config: {
				text: "www.michaelteeuw.nl"
			}
		}
	],

	paths: {
		modules: "modules",
		vendor: "vendor"
	}
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = defaults;
}
