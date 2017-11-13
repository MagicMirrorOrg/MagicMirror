/* Magic Mirror Config Sample
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], // Set [] to allow all IP addresses.

	language: "fr",
	timeFormat: 24,
	units: "metric",

	modules: [
		{
			module: "alert",
		},
		{
			module: "updatenotification",
			position: "top_bar"
		},
		{
			module: "clock",
			position: "top_left"
		},
		{
			module: "calendar",
			header: "Jours Fériés",
			position: "top_left",
			config: {
				calendars: [
					{
						symbol: "calendar-check-o ",
						//url: "webcal://www.calendarlabs.com/templates/ical/US-Holidays.ics"
						url: "https://www.mozilla.org/media/caldata/FrenchHolidays.ics"
					}
				],
				fade: false
			}
		},
		{
			module: "compliments",
			position: "lower_third",
			config: {
				compliments: {
					anytime: [
						"Hey there sexy!"
					],
					morning: [
						"Good morning, handsome!",
						"Enjoy your day!",
						"How was your sleep?"
					],
					afternoon: [
						"Hello, beauty!",
						"You look sexy!",
						"Looking good today!"
					],
					evening: [
						"Wow, you look hot!",
						"You look nice!",
						"Hi, sexy!"
					],
					day_sunny: ["It's a beautiful day"],
					rain: ["Don't forget your umbrella"],
					snow: ["Snowball battle!"]
				}
			}
		},
		{
			module: "currentweather",
			position: "top_right",
			config: {
				location: "Paris",
				//locationID: "",  //ID from http://www.openweathermap.org/help/city_list.txt
				appid: "d96fa981c1fdaf6caee68c9d5cc10f4c"
			}
		},
		{
			module: "weatherforecast",
			position: "top_right",
			header: "Prévision Météo",
			config: {
				location: "Paris",
				//locationID: "5128581",  //ID from http://www.openweathermap.org/help/city_list.txt
				appid: "d96fa981c1fdaf6caee68c9d5cc10f4c",
				fade: false
			}
		},
		{
			module: "newsfeed",
			position: "bottom_bar",
			config: {
				feeds: [
					{
						title: "New York Times",
						url: "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml"
					},
					{
						title: "Le Monde",
						url: "http://www.lemonde.fr/rss/une.xml"
					}
				],
				showSourceTitle: true,
				showPublishDate: true
			}
		},
	]

};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}
