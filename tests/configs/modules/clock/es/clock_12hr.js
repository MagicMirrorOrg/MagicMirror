/* MagicMirror² Test config for default clock module
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
let config = {
	language: "es",
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
