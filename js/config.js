var config = {
    lang: 'en',
    time: {
        timeFormat: 12,
        displaySeconds: true,
        digitFade: false,
    },
    weather: {
        //units: metric or imperial
        params: {
            q: 'Chicago,IL,USA',
            units: 'imperial',
            // if you want a different lang for the weather that what is set above, change it here
            lang: 'en',
            APPID: 'b227a533d15d3d8af2396ed411cb56a6'
        }
    },
    compliments: {
        interval: 30000,
        fadeInterval: 1000,
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
			symbol: 'calendar-plus-o', 
			url: 'https://calendar.google.com/calendar/ical/ryancowan%40gmail.com/private-5faa219a5c3a60dcc4672772db012b05/basic.ics'
		},
		]
    },
    news: {
        feed: 'http://newsrss.bbc.co.uk/rss/newsonline_uk_edition/front_page/rss.xml'
    }
}
