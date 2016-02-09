var config = {
    lang: 'de',
    time: {
        timeFormat: 24,
        displaySeconds: true,
        digitFade: true,
    },
    weather: {
        //change weather params here:
        //units: metric or imperial
        params: {
            q: 'Immenstadt,Germany',
            units: 'metric',
            // if you want a different lang for the weather that what is set above, change it here
            lang: 'de',
            APPID: 'a250e3c3974146ebdd0d8dc7531a18d0'
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
        maximumEntries: 10, // Total Maximum Entries
		displaySymbol: true,
		defaultSymbol: 'calendar', // Fontawsome Symbol see http://fontawesome.io/cheatsheet/
        urls: [
		{
			symbol: 'fa fa-car',
			url: 'http://www.f1calendar.com/download/f1-calendar_gp.ics',
		},
		{
			symbol: ' fa-thumbs-o-up',
			url: "http://www.ifeiertage.de/by-sk.ics",
		},
		//kalender ronny
		{
			symbol: ' fa-calendar',
			url: "https://p03-calendarws.icloud.com/ca/subscribe/1/wS3q4HczPRliFU8O_5VcP12D70dxo6siCCozpQEC84vpL7DeDbLbhNz5oYvNkR36",
		},
		// {
			// symbol: 'venus-mars',
			// url: "https://server/url/to/theirs.ics",
		// },
		]
    },
    news: {
        feed: 'http://www.tagesschau.de/xml/rss2'
    }
}
