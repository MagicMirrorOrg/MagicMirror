MagicMirror
===========

##Introduction

The super magic interface of my personal Magic Mirror. More information about this project can be found on my [blog](http://michaelteeuw.nl/tagged/magicmirror).

Runs as a php script on a web server with basically no external dependencies. Can use socket.io for XBEE integration, but isn't required for basic functionality.


##Configuration

Modify js/config.js to change some general variables (language, wather location, compliments, news feed RSS and to add your own ICS calendar)

To use the OpenWeatherMap API, you'll need a free API key. Checkout [this blogpost](http://michaelteeuw.nl/post/131504229357/what-happened-to-the-weather) for more information.

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

##Extensions

###[MagicMirror-Extensions by PaViRo](https://github.com/paviro/MagicMirror-Extensions)

**Current features:** FRITZ!Box Callmonitor <br>
**Future features:** Faceregognition, personalized views, online banking through HBCI and multiple calenders based on faceregognition.