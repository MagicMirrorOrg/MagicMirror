MagicMirror
===========

##Introduction

The super magic interface of my personal Magic Mirror. More information about this project can be found on my [blog](http://michaelteeuw.nl/tagged/magicmirror).

Runs as a php script on a web server with basically no external dependencies. Can use socket.io for XBEE integration, but isn't required for basic functionality.


##Configuration

Modify js/config.js to change some general variables (language, wather location, compliments, news feed RSS) and calendar.php to add your own ICS calendar

###Weather

To use the OpenWeatherMap API, you'll need a free API key. Checkout [this blogpost](http://michaelteeuw.nl/post/131504229357/what-happened-to-the-weather) for more information.

Since the API secret should not be shared publically, you can create a js/config.weather.js to specify the weather information (including the API secret):

```
config.weather = {
    //change weather params here:
    //units: metric or imperial
    params: {
        q: 'Arnold, Maryland',
        units: 'imperial',
        // if you want a different lang for the weather that what is set above, change it here
        lang: 'en',
        APPID: 'API-KEY-HERE'
    },
}
```

###Travel

To see travel times from your home to various locations, you need an API key for Google Maps from the [Google Developer Console](https://console.developers.google.com). To keep this and your locations private, create a js/config.travel.js file to specify these parameters:

```
config.travel = {
    params: {
        origin: 'home address',
        destinations: [
            'my first destination',
            'my second destination',
        ]
    },
    api: {
        key: 'API-KEY-HERE'
    }
}
```

##Code

###[main.js](js/main.js)

This file initiates the separate pieces of functionality that will appear in the view.  It also includes various utility functions that are used to update what is visible.

###[Calendar](js/calendar)

Parsing functionality for the Calendar that retrieves and updates the calendar based on the interval set at the top of the [calendar.js](js/calendar/calendar.js) file. This was actually a straight pull from the original main.js file but the parsing code may deserve an upgrade.

###[Compliments](js/compliments)

Functionality related to inserting compliments into the view and rotating them based on a specific interval set at the top of the [compliments.js](js/compliments/compliments.js) file.

###[News](js/news)

Takes an array of news feeds (or a single string) from the config file and retrieves each one so that it can be displayed in a loop based on the interval set at the top of the [news.js](js/news/news.js) file.

###[Time](js/time)

Updates the time on the screen on one second interval.

###[Version](js/version)

Checks the git version and refreshes if a new version has been pulled.

###[Weather](js/weather)

Takes the user's inserted location, language, unit type, and OpenWeatherMap API key and grabs the five day weather forecast from OpenWeatherMap. You need to set the API key in the config for this to work. (See *configuration*.)

###[Travel](js/travel)

Using a home location (origin) and a list of destinations, query Google Maps to determine the travel times from the origin to each location. Unfortunately this doesn't currently utilize traffic information.
