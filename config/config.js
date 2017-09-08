/* Magic Mirror Config File
 *
 * By Tyvonne
 *
 * For more information how you can configurate this file
 * See https://github.com/MichMich/MagicMirror#configuration
 *
 */

var config = {
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], // Set [] to allow all IP addresses
	// or add a specific IPv4 of 192.168.1.5 :
	// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
	// or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
	// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

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
			position: "bottom_bar",
		},
		{
			module: "calendar",
			header: "Prochains rendez-vous de la famille",
			position: "top_left",
			config: {
				calendars: [
					{
						symbol: 'calendar-check-o',
						url: 'webcal://calendar.google.com/calendar/ical/tavernier.thibaut%40gmail.com/private-79a455094de6f8abcbc8b2be20b5409c/basic.ics'
					},
					{
						symbol: 'female',
						url: 'webcal://calendar.google.com/calendar/ical/tavernier.y%40gmail.com/private-7ba9dc6616437be70b09a2c4e6dc97e3/basic.ics'
					},

				],
			}
		},
		//		{
		//		    module: 'compliments',
		//		    position: 'lower_third',
		//		    config: {
		//		        compliments: {
		//		            morning: [
		//						'Train Schedule coming soon',
		//						'Take care'
		//		            ],
		//		            afternoon: [
		//						'Train Schedule coming soon',
		//						'Magic Mirror dashboard'
		//		            ],
		//		            evening: [
		//						'Train Schedule coming soon'
		//		            ]
		//		        },
		//		        updateInterval: 30000,
		//		        fadeSpeed: 4000
		//		    },
		//		},
		{
			module: 'currentweather',
			position: 'top_right',
			config: {
				location: 'Paris,France',
				locationID: '',
				appid: '52f6686609996bbe3919c6bd2eaf0bca'
			},
		},
		{
			module: 'weatherforecast',
			position: 'top_right',
			header: "Prévisions",
			config: {
				location: 'Paris,France',
				locationID: '',
				appid: '52f6686609996bbe3919c6bd2eaf0bca'
			},
		},
		{
			module: 'newsfeed',
			position: 'bottom_bar',
			config: {
				feeds: [
					{
						title: 'Le Monde',
						url: 'http://www.lemonde.fr/rss/une.xml'
					},
				],
				showSourceTitle: true,
				showPublishDate: true
			}
		},

		{
			module: 'trainschedule',
			header: 'Next train schedule',
			position: 'top_left',
			config: {
				nextTrainText: 'dans %delay% min',
				nextDateText: '%delay%',
				defaultSymbol: 'train',
				alarmRemainDelay: 4000,
				minutesRemainDelay: 30000,
				trains: [
					{
						departure: '87384008',
						arrival: '87276055',
						name: 'SARA',
						date: '14/11/2016 23:17'
					},
					{
						departure: '87384008',
						arrival: '87276055',
						name: 'PSLAZ',
						date: '14/11/2016 16:00'
					},
					{
						departure: '87384008',
						arrival: '87276055',
						name: 'Le RER de Djé',
						date: '14/11/2016 00:22'
					},
					{
						departure: '87384008',
						arrival: '87276055',
						name: 'PSLAZ',
						date: '14/11/2016 00:52'
					},
				],
			},
		},
	]

};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
