var config = {
    lang: 'en',
    weather: {
        //change weather params here:
        //units: metric or imperial
        params: {
            q: 'Philadelphia, Pennsylvania',
            units: 'imperial',
            // if you want a different lang for the weather that what is set above, change it here
            lang: 'en',
            APPID: 'ba8a928b5152be1d4b371b256554abfc'
        }
    },
    compliments: {
        interval: 2000,
        fadeInterval: 4000,
        morning: [
            'Are you always so stupid or is today a special occasion?',
            'Don\'t feel bad. A lot of people have no talent!',
            'I don\'t know what makes you so stupid, but it really works.'
        ],
        afternoon: [
            'How did you get here? Did someone leave your cage open?',
            'I know you were born ugly, but why did you have a relapse?',
            'I know you\'re not as stupid as you look. Nobody could be!'
        ],
        evening: [
            'How come you\'re here? I thought the zoo is closed at night!',
            'I\'d like to kick you in the teeth, but why should I improve your looks?',
            'If I had a face like yours. I\'d sue my parents!'
        ]
    }
}

// var feed = 'http://feeds.nos.nl/nosjournaal?format=rss';
//var feed = 'http://www.nu.nl/feeds/rss/achterklap.rss';
//var feed = 'http://www.nu.nl/feeds/rss/opmerkelijk.rss';
var feed = 'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml';
