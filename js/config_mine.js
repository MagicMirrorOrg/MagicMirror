var config = {
    lang: 'en',
    time: {
        timeFormat: 12
    },
    weather: {
        //change weather params here:
        //units: metric or imperial
        params: {
            q: 'Charlotte,US',
            units: 'imperial',
            lang: 'en',
            APPID: 'bfb1239b4a4b0a366862fc3be59c5be6'
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
        maximumEntries: 10,
        url: "https://calendar.google.com/calendar/ical/scottr2015%40gmail.com/private-53abbe11f63ebf48a1f88dd61a796995/basic.ics"
    },
    news: {
        feed: 'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml'
    },
	quote: {
        // fadeInterval: 4000,
		fetchInterval: 3700000,
		updateInterval: 7000,
		feed: 'http://feeds.feedburner.com/theysaidso/qod'
	}
}
