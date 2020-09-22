/* Magic Mirror Test config for analog clock face
 *
 * MIT Licensed.
 */
let config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

	language: "en",
	timeFormat: 24,
	units: "metric",
	electronOptions: {
		webPreferences: {
			nodeIntegration: true
		}
	},

	modules: [
		{
			module: "clock",
			position: "middle_center",
			config: {
				displayType: "analog",
				analogFace: "face-006"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
