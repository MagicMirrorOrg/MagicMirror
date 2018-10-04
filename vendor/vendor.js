/* exported vendor */

/* Magic Mirror
 * Vendor File Definition
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var vendor = {
	"moment.js" : "node_modules/moment/min/moment-with-locales.js",
	"moment-timezone.js" : "node_modules/moment-timezone/builds/moment-timezone-with-data.js",
	"weather-icons.css": "node_modules/weathericons/css/weather-icons.css",
	"weather-icons-wind.css": "node_modules/weathericons/css/weather-icons-wind.css",
	"font-awesome.css": "node_modules/font-awesome/css/font-awesome.min.css",
	"font-awesome5.css": "node_modules/@fortawesome/fontawesome-free/css/all.min.css",
	"font-awesome5.v4shims.css": "node_modules/@fortawesome/fontawesome-free/css/v4-shims.min.css",
	"nunjucks.js": "node_modules/nunjucks/browser/nunjucks.min.js"
};

if (typeof module !== "undefined"){module.exports = vendor;}
