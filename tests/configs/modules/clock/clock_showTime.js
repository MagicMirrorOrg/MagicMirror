/* MagicMirror² Test config for default clock module
 *
 * By Johan Hammar
 * MIT Licensed.
 */
let config = {
	timeFormat: 12,

	modules: [
		{
			module: "clock",
			position: "middle_center",
			config: {
				showTime: false
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
