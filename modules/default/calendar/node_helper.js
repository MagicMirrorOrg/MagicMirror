/* MagicMirror²
 * Node Helper: Calendar
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
const NodeHelper = require("node_helper");
const CalendarFetcher = require("./calendarfetcher.js");
const Log = require("logger");

module.exports = NodeHelper.create({
	// Override start method.
	start: function () {
		Log.log("Starting node helper for: " + this.name);
		this.fetchers = [];
	},

	// Override socketNotificationReceived method.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "ADD_CALENDAR") {
			this.createFetcher(payload.url, payload.fetchInterval, payload.excludedEvents, payload.maximumEntries, payload.maximumNumberOfDays, payload.auth, payload.broadcastPastEvents, payload.selfSignedCert, payload.id);
		}
	},

	/**
	 * Creates a fetcher for a new url if it doesn't exist yet.
	 * Otherwise it reuses the existing one.
	 *
	 * @param {string} url The url of the calendar
	 * @param {number} fetchInterval How often does the calendar needs to be fetched in ms
	 * @param {string[]} excludedEvents An array of words / phrases from event titles that will be excluded from being shown.
	 * @param {number} maximumEntries The maximum number of events fetched.
	 * @param {number} maximumNumberOfDays The maximum number of days an event should be in the future.
	 * @param {object} auth The object containing options for authentication against the calendar.
	 * @param {boolean} broadcastPastEvents If true events from the past maximumNumberOfDays will be included in event broadcasts
	 * @param {boolean} selfSignedCert If true, the server certificate is not verified against the list of supplied CAs.
	 * @param {string} identifier ID of the module
	 */
	createFetcher: function (url, fetchInterval, excludedEvents, maximumEntries, maximumNumberOfDays, auth, broadcastPastEvents, selfSignedCert, identifier) {
		try {
			new URL(url);
		} catch (error) {
			Log.error("Calendar Error. Malformed calendar url: ", url, error);
			this.sendSocketNotification("CALENDAR_ERROR", { error_type: "MODULE_ERROR_MALFORMED_URL" });
			return;
		}

		let fetcher;
		if (typeof this.fetchers[identifier + url] === "undefined") {
			Log.log("Create new calendarfetcher for url: " + url + " - Interval: " + fetchInterval);
			fetcher = new CalendarFetcher(url, fetchInterval, excludedEvents, maximumEntries, maximumNumberOfDays, auth, broadcastPastEvents, selfSignedCert);

			fetcher.onReceive((fetcher) => {
				this.broadcastEvents(fetcher, identifier);
			});

			fetcher.onError((fetcher, error) => {
				Log.error("Calendar Error. Could not fetch calendar: ", fetcher.url(), error);
				let error_type = NodeHelper.checkFetchError(error);
				this.sendSocketNotification("CALENDAR_ERROR", {
					id: identifier,
					error_type
				});
			});

			this.fetchers[identifier + url] = fetcher;
		} else {
			Log.log("Use existing calendarfetcher for url: " + url);
			fetcher = this.fetchers[identifier + url];
			fetcher.broadcastEvents();
		}

		fetcher.startFetch();
	},

	/**
	 *
	 * @param {object} fetcher the fetcher associated with the calendar
	 * @param {string} identifier the identifier of the calendar
	 */
	broadcastEvents: function (fetcher, identifier) {
		this.sendSocketNotification("CALENDAR_EVENTS", {
			id: identifier,
			url: fetcher.url(),
			events: fetcher.events()
		});
	}
});
