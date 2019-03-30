/* Magic Mirror Config Sample
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information how you can configurate this file
 * See https://github.com/MichMich/MagicMirror#configuration
 *
 */

var config = {
	address: "localhost", // Address to listen on, can be:
	// - "localhost", "127.0.0.1", "::1" to listen on loopback interface
	// - another specific IPv4/6 to listen on a specific interface
	// - "", "0.0.0.0", "::" to listen on any interface
	// Default, when address config is left out, is "localhost"
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], // Set [] to allow all IP addresses
	// or add a specific IPv4 of 192.168.1.5 :
	// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
	// or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
	// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

	language: "en",
	timeFormat: 24,
	units: "metric",

	modules: [{
		module: "alert"
	},
	{
		module: "MMM-GoogleTasks",
		header: "Google Tasks",
		position: "top_left",
		config: {
			listID: "MTU3NDQ4MDA4MjAxNzAzMzI1NzQ6MDow"
			// See below for Configuration Options
		}
	},
	{
		module: "MMM-EmbedYoutube", // Path to youtube module from modules folder Exmaple: MagicMirror/modules/custom/MMM-EmbedYoutube/ so it's custom/MMM-EmbedYoutube
		position: "bottom_bar", // This can be any of the regions.
		config: {
			// See 'Configuration options' in README.md for more information.
			video_id: "w3jLJU7DT5E",
			loop: true,
			autoplay: true,
			color: "red"
		}
	},
	{
		module: "updatenotification",
		position: "top_bar"
	},
	{
		module: "clock",
		position: "top_left"
	},
	// {
	// 	module: "MMM-MyCalendar",
	// 	position: "top_left", // This can be any of the regions. Best results in left or right regions.
	// 	config: {
	// 		// The config property is optional.
	// 		// If no config is set, an example calendar is shown.
	// 		// See 'Configuration options' for more information.
	// 	}
	// },
	{
		module: "Taiwan-Bus",
		position: "top_right",
		config: {}
	},
	// {
	// 	module: "calendar",
	// 	header: "US Holidays",
	// 	position: "top_left",
	// 	config: {
	// 		calendars: [
	// 			{
	// 				symbol: "calendar-check",
	// 				url:
	//                     "webcal://www.calendarlabs.com/templates/ical/US-Holidays.ics"
	// 			}
	// 		]
	// 	}
	// },
	// {
	// 	module: "compliments",
	// 	position: "lower_third"
	// },
	{
		module: "currentweather",
		position: "top_right",
		config: {
			location: "Taipei",
			locationID: "1668341", //ID from http://bulk.openweathermap.org/sample/; unzip the gz file and find your city
			appid: "4d7cc19eb1a010cef5e969401e23e1ce"
		}
	},
		// {
		// 	module: "weatherforecast",
		// 	position: "top_right",
		// 	header: "Weather Forecast",
		// 	config: {
		// 		location: "New York",
		// 		locationID: "5128581", //ID from https://openweathermap.org/city
		// 		appid: "YOUR_OPENWEATHER_API_KEY"
		// 	}
		// },
		// {
		// 	module: "newsfeed",
		// 	position: "bottom_bar",
		// 	config: {
		// 		feeds: [
		// 			{
		// 				title: "New York Times",
		// 				url:
		//                     "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml"
		// 			}
		// 		],
		// 		showSourceTitle: true,
		// 		showPublishDate: true
		// 	}
		// }
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}