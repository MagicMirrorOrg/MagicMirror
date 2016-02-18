var config = {
    lang: 'nl',
    time: {
        timeFormat: 12,
        displaySeconds: true,
        digitFade: false,
    },
    weather: {
        //change weather params here:
        //units: metric or imperial
        params: {
            q: 'Baarn,Netherlands'
            units: 'metric',
            // if you want a different lang for the weather that what is set above, change it here
            lang: 'nl',
            APPID: 'YOUR_FREE_OPENWEATHER_API_KEY'
        }
    },
    compliments: {
        interval: 30000,
        fadeInterval: 4000,
        morning: [
            'Good morning, handsome!',
            'Enjoy your day!',
            'How was your sleep?'
        ],
        afternoon: [
            'Hello, beauty!',
            'You look sexy!',
            'Looking good today!'
        ],
        evening: [
            'Wow, you look hot!',
            'You look nice!',
            'Hi, sexy!'
        ]
    },
    calendar: {
        maximumEntries: 10, //Total Maximum Entries
		displaySymbol: true,
		defaultSymbol: 'calendar', // Fontawsome Symbol see http://fontawesome.io/cheatsheet/
        // In order to fetch geegle calendar events on calendars that are shared you will need to use the google API
        // to use the API you will need an API Client ID.
        // the instructions are here: https://developers.google.com/google-apps/calendar/quickstart/js
        // if you want to be able to access the calendar from another machine then you will also need to register the pi's
        // local address not just localhost.
        // Your Client ID can be retrieved from your project in the Google
        // Developer Console, https://console.developers.google.com
        // un comment googleCalendarApiId if you want to use it
        //googleCalendarApiId: 'YOUR_API_CLIENT_ID',
        urls: [
        {
            symbol: 'calendar-plus-o',
            // googleOauthApi is a boolean to indicate which calendars should use the api instead of pulling the ics
            googleOauthApi: false,
            //if using the goodle api use the calendar ID instead of the ical url
            url: 'https://p01-calendarws.icloud.com/ca/subscribe/1/n6x7Farxpt7m9S8bHg1TGArSj7J6kanm_2KEoJPL5YIAk3y70FpRo4GyWwO-6QfHSY5mXtHcRGVxYZUf7U3HPDOTG5x0qYnno1Zr_VuKH2M',
        },
        {
            symbol: 'soccer-ball-o',
            googleOauthApi: false,
            url: 'https://www.google.com/calendar/ical/akvbisn5iha43idv0ktdalnor4%40group.calendar.google.com/public/basic.ics',
		},
		// {
			// symbol: 'mars',
			// url: "https://server/url/to/his.ics",
		// },
		// {
			// symbol: 'venus',
			// url: "https://server/url/to/hers.ics",
		// },
		// {
			// symbol: 'venus-mars',
			// url: "https://server/url/to/theirs.ics",
		// },
		]
    },
    news: {
        feed: 'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml'
    }
}
