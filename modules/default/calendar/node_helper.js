/* Magic Mirror
 * Node Helper: Calendar
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const validUrl = require("valid-url");
const CalendarFetcher = require("./calendarfetcher.js");
const Log = require("../../../js/logger");

module.exports = NodeHelper.create({
	// Override start method.
	start: function () {
		Log.log("Starting node helper for: " + this.name);
		this.fetchers = [];
	},

	// Override socketNotificationReceived method.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "ADD_CALENDAR") {
			this.createFetcher(payload.url, payload.fetchInterval, payload.excludedEvents, payload.maximumNumberOfDays, payload.auth, payload.broadcastPastEvents, payload.id);
		}
	},

	/* createFetcher(url, reloadInterval)
	 * Creates a fetcher for a new url if it doesn't exist yet.
	 * Otherwise it reuses the existing one.
	 *
	 * attribute url string - URL of the news feed.
	 * attribute reloadInterval number - Reload interval in milliseconds.
	 */
	createFetcher: function (url, fetchInterval, excludedEvents, maximumNumberOfDays, auth, broadcastPastEvents, identifier) {
		var self = this;

		if (!validUrl.isUri(url)) {
			self.sendSocketNotification("INCORRECT_URL", { id: identifier, url: url });
			return;
		}

		var fetcher;
		if (typeof self.fetchers[identifier + url] === "undefined") {
			Log.log("Create new calendar fetcher for url: " + url + " - Interval: " + fetchInterval);
			fetcher = new CalendarFetcher(url, fetchInterval, excludedEvents, maximumNumberOfDays, auth, broadcastPastEvents);

			fetcher.onReceive(function (fetcher) {
				self.sendSocketNotification("CALENDAR_EVENTS", {
					id: identifier,
					url: fetcher.url(),
					events: fetcher.events()
				});
			});

			fetcher.onError(function (fetcher, error) {
				Log.error("Calendar Error. Could not fetch calendar: ", fetcher.url(), error);
				self.sendSocketNotification("FETCH_ERROR", {
					id: identifier,
					url: fetcher.url(),
					error: error
				});
			});

			self.fetchers[identifier + url] = fetcher;
		} else {
			Log.log("Use existing calendar fetcher for url: " + url);
			fetcher = self.fetchers[identifier + url];
			fetcher.broadcastEvents();
		}

		fetcher.startFetch();
	}
});
