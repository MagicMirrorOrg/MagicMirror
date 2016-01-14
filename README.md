MagicMirror
===========

##Introduction

The basis for this project can be found on this [blog](http://michaelteeuw.nl/tagged/magicmirror), and all credit should go there.

Runs as a php script on a web server with basically no external dependencies.

##Configuration

Modify js/config.js to change some general variables (language, compliments, and news feed RSS)

To use the OpenWeatherMap API, you'll need a free API key. Checkout [this blogpost](http://michaelteeuw.nl/post/131504229357/what-happened-to-the-weather) for more information.

##Code

###[main.js](js/main.js)

This file initiates the separate pieces of functionality that will appear in the view.  It also includes various utility functions that are used to update what is visible.

###[Compliments](js/compliments)

Functionality related to inserting compliments into the view and rotating them based on a specific interval set at the top of the [compliments.js](js/compliments/compliments.js) file.

###[News](js/news)

Takes an array of news feeds (or a single string) from the config file and retrieves each one so that it can be displayed in a loop based on the interval set at the top of the [news.js](js/news/news.js) file.

###[Time](js/time)

Updates the time on the screen on one second interval.

###[Version](js/version)

Checks the git version and refreshes if a new version has been pulled. Additionally, a cron job runs on the Pi every day at 2AM, to automatically pull the latest version from the repository, so all changes can be made remotely, and will trickle down to the Pi overnight, automatically.

###[Weather](js/weather)

Takes the user's inserted location, language, unit type, and OpenWeatherMap API key and grabs the five day weather forecast from OpenWeatherMap. You need to set the API key in a separate file for this to work. 

###[Keys](js/keys_TEMPLATE.js)

Stores private data, primarily API keys, but also locations and birthdays
