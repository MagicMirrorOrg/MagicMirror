/* Magic Mirror
 * Default Modules List
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

// Modules listed below can be loaded without the 'default/' prefix. Omitting the default folder name.

var defaultModules = [
	"alert",
	"calendar",
	"clock",
	"compliments",
	"currentweather",
	"helloworld",
	"newsfeed",
	"weatherforecast",
	"updatenotification"
];

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = defaultModules;}
