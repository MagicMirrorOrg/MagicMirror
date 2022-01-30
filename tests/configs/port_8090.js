/* MagicMirror² Test config sample environment set port 8090
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
let config = require(process.cwd() + "/tests/configs/default.js").configFactory({
	port: 8090
});

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
