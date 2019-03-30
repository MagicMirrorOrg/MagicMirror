/* Magic Mirror
 * Node Helper: Calendar
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var validUrl = require("valid-url");
var BusFetcher = require("./busFetcher.js");

module.exports = NodeHelper.create({
	// Override start method.
	start: function () {
		var events = [];
		this.fetchers = [];
		console.log("Starting node helper for: " + this.name);

	},
	// Override socketNotificationReceived method.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "ADD_BUS") {
			var seturl = "https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=StopName%2FZh_tw%20eq%20'%E5%85%89%E8%8F%AF%E5%95%86%E5%A0%B4'&$top=30&$format=JSON"

			this.createFetcher(seturl, payload.fetchInterval);
		}
	},

	/* createFetcher(url, reloadInterval)
	 * Creates a fetcher for a new url if it doesn't exist yet.
	 * Otherwise it reuses the existing one.
	 *
	 * attribute url string - URL of the news feed.
	 * attribute reloadInterval number - Reload interval in milliseconds.
	 */

	createFetcher: function (url, fetchInterval) {
		var self = this;
		console.log("check url", url)
		if (!validUrl.isUri(url)) {
			self.sendSocketNotification("INCORRECT_URL", {
				url: url
			});
			return;
		}

		var fetcher;
		if (typeof self.fetchers[url] === "undefined") {
			console.log("Create new calendar fetcher for url: " + url + " - Interval: " + fetchInterval);
			fetcher = new BusFetcher(url, fetchInterval);
			fetcher.onReceive(function (fetcher) {
				//console.log('Broadcast events.');
				//console.log(fetcher.events());
				//console.log("!")
				self.sendSocketNotification("BUS_EVENTS", {
					events: fetcher.events()
				});
			});

			fetcher.onError(function (fetcher, error) {
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