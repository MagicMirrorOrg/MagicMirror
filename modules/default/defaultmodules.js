/* MagicMirror² Default Modules List
 * Modules listed below can be loaded without the 'default/' prefix. Omitting the default folder name.
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
const defaultModules = ["alert", "calendar", "clock", "compliments", "currentweather", "helloworld", "newsfeed", "weatherforecast", "updatenotification", "weather"];

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = defaultModules;
}
