/* MagicMirror² Test config compliments with remote file
 *
 * By Rejas
 * MIT Licensed.
 */
let config = {
	modules: [
		{
			module: "compliments",
			position: "middle_center",
			config: {
				remoteFile: "http://localhost:8080/tests/mocks/compliments_test.json"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
