/* Magic Mirror
 * Node Helper: Calendar
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var validUrl = require("valid-url");
var CalendarFetcher = require("./calendarfetcher.js");

module.exports = NodeHelper.create({
	// Override start method.
	start: function() {
		var events = [];

		this.fetchers = [];

		console.log("Starting node helper for: " + this.name);

	},

	// Override socketNotificationReceived method.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "ADD_CALENDAR") {
			//console.log('ADD_CALENDAR: ');
			this.createFetcher(payload.url, payload.fetchInterval, payload.excludedEvents, payload.maximumEntries, payload.maximumNumberOfDays, payload.auth, payload.broadcastPastEvents);
		}
	},

	/* createFetcher(url, reloadInterval)
	 * Creates a fetcher for a new url if it doesn't exist yet.
	 * Otherwise it reuses the existing one.
	 *
	 * attribute url string - URL of the news feed.
	 * attribute reloadInterval number - Reload interval in milliseconds.
	 */

	createFetcher: function(url, fetchInterval, excludedEvents, maximumEntries, maximumNumberOfDays, auth, broadcastPastEvents) {
		var self = this;

		if (!validUrl.isUri(url)) {
			self.sendSocketNotification("INCORRECT_URL", {url: url});
			return;
		}

		var fetcher;
		if (typeof self.fetchers[url] === "undefined") {
			console.log("Create new calendar fetcher for url: " + url + " - Interval: " + fetchInterval);
			fetcher = new CalendarFetcher(url, fetchInterval, excludedEvents, maximumEntries, maximumNumberOfDays, auth, broadcastPastEvents);

			fetcher.onReceive(function(fetcher) {
				//console.log('Broadcast events.');
				//console.log(fetcher.events());

				self.sendSocketNotification("CALENDAR_EVENTS", {
					url: fetcher.url(),
					events: fetcher.events()
				});
			});

			fetcher.onError(function(fetcher, error) {
				console.error("Calendar Error. Could not fetch calendar: ", fetcher.url(), error);
				self.sendSocketNotification("FETCH_ERROR", {
					url: fetcher.url(),
					error: error
				});
			});

			self.fetchers[url] = fetcher;
		} else {
			//console.log('Use existing news fetcher for url: ' + url);
			fetcher = self.fetchers[url];
			fetcher.broadcastEvents();
		}

		fetcher.startFetch();
	}
});
