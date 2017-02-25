/* Magic Mirror Deprecated Config Options List
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 *
 * Olex S. original idea this deprecated option
 */
var colors = require("colors/safe");
colors.setTheme({warn: "yellow"})

var deprecated = {
	configs: ["kioskmode"],
	colors: colors
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = deprecated;}
