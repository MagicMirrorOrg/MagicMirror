var config = {
    lang: 'en',
    time: {
        timeFormat: 12
    },
    weather: {
        //change weather params here:
        //units: metric or imperial
        params: {
            id: '5130780',
            units: 'imperial',
            // if you want a different lang for the weather that what is set above, change it here
            lang: 'en',
            APPID: '2ff9ddbf3b526cbd233c307b7c9e5b14'
        }
    },
    compliments: {
        interval: 30000,
        fadeInterval: 4000,
        morning: [
            'Good morning!',
            'Enjoy your day!',
            'How was your sleep?'
        ],
        afternoon: [
            'You look nice!',
            'You look terrifc!',
            'You are not a total idiot!'
        ],
        evening: [
            'You have great taste in mirrors!',
            'Your face makes other people look ugly!',
            'Dogs, better than people, since forever'
        ],
        birthday: [
            'Happy Birthday!',
            'Have a great birthday today!',
            'Yay, your birthday is today!'
        ],
        christmas: [
            'Merry Christmas!',
            '¡Feliz Navidad!',
            'Nollaig Shona Duit!',
			'Happy Christmas!'
        ]
		
    },
    news: {
        feed: [
			'http://feeds.reuters.com/reuters/healthNews',
			'http://feeds.reuters.com/reuters/oddlyEnoughNews',
			'http://feeds.reuters.com/Reuters/domesticNews',
			'http://feeds.reuters.com/Reuters/worldNews'
		]
    }
}
