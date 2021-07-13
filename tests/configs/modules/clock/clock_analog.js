/* Magic Mirror Test config for analog clock face
 *
 * MIT Licensed.
 */
let config = require(process.cwd() + "/tests/configs/default.js").configFactory({
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
