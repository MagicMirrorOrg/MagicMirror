/* global mmPort */

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
	foreignModulesDir: "modules",
	// httpHeaders used by helmet, see https://helmetjs.github.io/. You can add other/more object values by overriding this in config.js,
	// e.g. you need to add `frameguard: false` for embedding MagicMirror in another website, see https://github.com/MagicMirrorOrg/MagicMirror/issues/2847
	httpHeaders: { contentSecurityPolicy: false, crossOriginOpenerPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false, originAgentCluster: false },

	// properties for checking if server is alive and has same startup-timestamp, the check is per default enabled
	// (interval 30 seconds). If startup-timestamp has changed the client reloads the magicmirror webpage.
	checkServerInterval: 30 * 1000,
	reloadAfterServerRestart: false,

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
				text: "https://magicmirror.builders/"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = defaults;
}
