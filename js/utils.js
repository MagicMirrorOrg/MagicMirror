/* exported Utils */
/* Magic Mirror
 * Utils
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */

var colors = require("colors/safe");

var Utils = {
	colors: {
		warn: colors.yellow
	}
};

if (typeof module !== "undefined") {module.exports = Utils;}
