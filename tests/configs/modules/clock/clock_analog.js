/* Magic Mirror Test config for analog clock face
 *
 * MIT Licensed.
 */
const configFactory = require("../../default.js");

const config = configFacory({
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
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
