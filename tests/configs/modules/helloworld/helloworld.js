/* Magic Mirror Test config sample module hello world
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
let config = {
	modules: [
		{
			module: "helloworld",
			position: "bottom_bar",
			config: {
				text: "Test HelloWorld Module"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
