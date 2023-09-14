/* MagicMirror² Test config sample module alert
 *
 * By rejas
 * MIT Licensed.
 */
let config = {
	modules: [
		{
			module: "alert",
			config: {
				display_time: 1000000,
				welcome_message: true
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
