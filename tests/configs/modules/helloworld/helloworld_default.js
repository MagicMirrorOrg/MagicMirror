/* MagicMirror² Test config sample module hello world default config
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
let config = {
	modules: [
		{
			module: "helloworld",
			position: "bottom_bar"
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
