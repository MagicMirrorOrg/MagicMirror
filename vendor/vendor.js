/* Magic Mirror
 * Vendor File Definition
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
var vendor = {
	"moment.js": "node_modules/moment/min/moment-with-locales.js",
	"moment-timezone.js": "node_modules/moment-timezone/builds/moment-timezone-with-data.js",
	"weather-icons.css": "node_modules/weathericons/css/weather-icons.css",
	"weather-icons-wind.css": "node_modules/weathericons/css/weather-icons-wind.css",
	"font-awesome.css": "css/font-awesome.css",
	"nunjucks.js": "node_modules/nunjucks/browser/nunjucks.min.js",
	"suncalc.js": "node_modules/suncalc/suncalc.js"
};

if (typeof module !== "undefined") {
	module.exports = vendor;
}
