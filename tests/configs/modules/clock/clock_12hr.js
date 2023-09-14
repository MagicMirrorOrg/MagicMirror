/* MagicMirror² Test config for default clock module
 *
 * By Sergey Morozov
 * MIT Licensed.
 */
let config = {
	timeFormat: 12,

	modules: [
		{
			module: "clock",
			position: "middle_center"
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
