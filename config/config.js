/* Magic Mirror Config Sample
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.1/24"],

	language: 'en',
	timeFormat: 12,
	units: 'imperial',

	modules: [
		
		{
			module: 'alert',
		},
		{	module: 'MMM-Remote-Control',
			position: 'bottom_left'
		},
		{
			module: "updatenotification",
			position: "top_bar"
		},
		{
			module: 'clock',
			position: 'top_left'
		},
		{
			module: 'calendar',
			header: 'Prayer Times',
			position: 'top_left',
			config: {
				calendars: [
					{
						symbol: 'calendar-check-o ',
						url: 'http://prayerwebcal.appspot.com/Philadelphia.ics?x=39.985&y=-75.253&z=-300&s=2&j=0'
					}
				]
			}
		},
		{
			module: 'compliments',
			position: 'lower_third',
			config:{
			    updateInterval: 30000,
			    compliments: {
				morning: [
				    "Have a FANTABULOUS day!",
				    "There's an opportunity right outside your door!",
				    "How was your sleep?"
				],
				afternoon: [
				    "If only I had a smile like yours.",
				    "Live to love so you can love life.",
				    "You look nice!"
				],
				evening: [
				    "Stay close to those who love you.",
				    "I hear the Overbrook Art Center is doing great!",
				    "True beauty lies beyond what you see before you."
				]
			    }
		}				    
		},
		{
			module: 'currentweather',
			position: 'top_right',
			config: {
				location: 'Philadelphia',
				locationID: '4560349',  //ID from http://www.openweathermap.org
				appid: 'f4614cb343bd86e4e4dce465d29cfb21'
			}
		},
		{
			module: 'weatherforecast',
			position: 'top_right',
			header: 'Weather Forecast',
			config: {
				location: 'Philadelphia',
				locationID: '4560349',  //ID from http://www.openweathermap.org
				appid: 'f4614cb343bd86e4e4dce465d29cfb21'
			}
		},
		{
			module: 'newsfeed',
			position: 'bottom_bar',
			config: {
				feeds: [
					{
						title: "New York Times",
						url: "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml"
					}
				],
				showSourceTitle: true,
				showPublishDate: true
			}
		},
	]

};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== 'undefined') {module.exports = config;}
