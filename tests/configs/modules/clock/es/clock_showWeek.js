
/* Magic Mirror
 *
 * Test config for default clock module
 * Language es for showWeek feature
 *
 * By Rodrigo Ramírez Norambuena
 *    https://rodrigoramirez.com
 *
 * MIT Licensed.
 */

var config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

	language: "es",
	timeFormat: 12,
	units: "metric",
	electronOptions: {
		webPreferences: {
			nodeIntegration: true,
		},
	},

	modules: [
		{
			module: "clock",
			position: "middle_center",
			config: {
				showWeek: true
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}
