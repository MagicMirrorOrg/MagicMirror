/* Magic Mirror Config Sample
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var config = {
    port: 8080,

    language: 'fr',
    timeFormat: 24,
    units: 'metric',

    modules: [
		{
		    module: 'alert',
		},
		{
		    module: 'clock',
		    position: 'top_left',
		    config: {
		        displayType: 'both', // options: digital, analog, both
				secondsColor: '#888888',
			},
		},
		{
		    module: 'calendar',
		    header: 'Prochains rendez-vous de Thibaut',
		    position: 'top_left',
		    config: {
		        calendars: [
					{
					    symbol: 'calendar-check-o',
					    url: 'webcal://calendar.google.com/calendar/ical/tavernier.thibaut%40gmail.com/private-79a455094de6f8abcbc8b2be20b5409c/basic.ics'
					},
		        ],
		    },
		},
		{
		    module: 'calendar',
		    header: 'Prochains rendez-vous de Yvonne',
		    position: 'top_left',
		    config: {
		        calendars: [
                    {
                        symbol: 'female',
                        url: 'webcal://calendar.google.com/calendar/ical/tavernier.y%40gmail.com/private-7ba9dc6616437be70b09a2c4e6dc97e3/basic.ics'
                    },
		        ],
		    },
		},
		{
		    module: 'calendar',
		    header: 'Prochains trains au depart',
		    position: 'top_center',
		    config: {
		        calendars: [
                    {
                        symbol: 'train',
                        url: 'webcal://calendar.google.com/calendar/ical/tavernier.y%40gmail.com/private-7ba9dc6616437be70b09a2c4e6dc97e3/basic.ics'
                    },
		        ],
		    },
		},
		{
		    module: 'compliments',
		    position: 'lower_third',
		    config: {
		        compliments: {
		            morning: [
						"Train Schedule coming soon",
						"Take care"
		            ],
		            afternoon: [
						"Train Schedule coming soon",
						"Magic Mirror dashboard"
		            ],
		            evening: [
						"Train Schedule coming soon"
		            ]
		        },
		        updateInterval: 30000,
		        fadeSpeed: 4000
		    },
		},
		{
		    module: 'newsfeed',
		    position: 'bottom_bar',
		    config: {
		        feeds: [
					{
					    title: "Le Monde",
					    url: "http://www.lemonde.fr/rss/une.xml"
					},
		        ],
		        showSourceTitle: true,
		        showPublishDate: true
		    }
		},
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
		    config: {
		        location: 'Paris,France',
		        locationID: '',
		        appid: '52f6686609996bbe3919c6bd2eaf0bca'
		    },
		},
    ]

};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== 'undefined') { module.exports = config; }