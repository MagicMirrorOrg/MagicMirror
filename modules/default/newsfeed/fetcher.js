/* Magic Mirror
 * Fetcher
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */

const Log = require("../../../js/logger.js");
const FeedMe = require("feedme");
const request = require("request");
const iconv = require("iconv-lite");

/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute url string - URL of the news feed.
 * attribute reloadInterval number - Reload interval in milliseconds.
 * attribute logFeedWarnings boolean - Log warnings when there is an error parsing a news article.
 */

var Fetcher = function (url, reloadInterval, encoding, logFeedWarnings) {
	var self = this;
	if (reloadInterval < 1000) {
		reloadInterval = 1000;
	}

	var reloadTimer = null;
	var items = [];

	var fetchFailedCallback = function () {};
	var itemsReceivedCallback = function () {};

	/* private methods */

	/* fetchNews()
	 * Request the new items.
	 */
	var fetchNews = function () {
		clearTimeout(reloadTimer);
		reloadTimer = null;
		items = [];

		var parser = new FeedMe();

		parser.on("item", function (item) {
			var title = item.title;
			var description = item.description || item.summary || item.content || "";
			var pubdate = item.pubdate || item.published || item.updated || item["dc:date"];
			var url = item.url || item.link || "";

			if (title && pubdate) {
				var regex = /(<([^>]+)>)/gi;
				description = description.toString().replace(regex, "");

				items.push({
					title: title,
					description: description,
					pubdate: pubdate,
					url: url
				});
			} else if (logFeedWarnings) {
				Log.warn("Can't parse feed item:");
				Log.warn(item);
				Log.warn("Title: " + title);
				Log.warn("Description: " + description);
				Log.warn("Pubdate: " + pubdate);
			}
		});

		parser.on("end", function () {
			self.broadcastItems();
			scheduleTimer();
		});

		parser.on("error", function (error) {
			fetchFailedCallback(self, error);
			scheduleTimer();
		});

		var nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
		var headers = { "User-Agent": "Mozilla/5.0 (Node.js " + nodeVersion + ") MagicMirror/" + global.version + " (https://github.com/MichMich/MagicMirror/)", "Cache-Control": "max-age=0, no-cache, no-store, must-revalidate", Pragma: "no-cache" };

		request({ uri: url, encoding: null, headers: headers })
			.on("error", function (error) {
				fetchFailedCallback(self, error);
				scheduleTimer();
			})
			.pipe(iconv.decodeStream(encoding))
			.pipe(parser);
	};

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */
	var scheduleTimer = function () {
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function () {
			fetchNews();
		}, reloadInterval);
	};

	/* public methods */

	/* setReloadInterval()
	 * Update the reload interval, but only if we need to increase the speed.
	 *
	 * attribute interval number - Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function (interval) {
		if (interval > 1000 && interval < reloadInterval) {
			reloadInterval = interval;
		}
	};

	/* startFetch()
	 * Initiate fetchNews();
	 */
	this.startFetch = function () {
		fetchNews();
	};

	/* broadcastItems()
	 * Broadcast the existing items.
	 */
	this.broadcastItems = function () {
		if (items.length <= 0) {
			Log.info("Newsfeed-Fetcher: No items to broadcast yet.");
			return;
		}
		Log.info("Newsfeed-Fetcher: Broadcasting " + items.length + " items.");
		itemsReceivedCallback(self);
	};

	this.onReceive = function (callback) {
		itemsReceivedCallback = callback;
	};

	this.onError = function (callback) {
		fetchFailedCallback = callback;
	};

	this.url = function () {
		return url;
	};

	this.items = function () {
		return items;
	};
};

module.exports = Fetcher;
