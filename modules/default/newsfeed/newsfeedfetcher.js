const crypto = require("node:crypto");
const stream = require("node:stream");
const FeedMe = require("feedme");
const iconv = require("iconv-lite");
const { htmlToText } = require("html-to-text");
const Log = require("logger");
const NodeHelper = require("node_helper");

/**
 * Responsible for requesting an update on the set interval and broadcasting the data.
 * @param {string} url URL of the news feed.
 * @param {number} reloadInterval Reload interval in milliseconds.
 * @param {string} encoding Encoding of the feed.
 * @param {boolean} logFeedWarnings If true log warnings when there is an error parsing a news article.
 * @param {boolean} useCorsProxy If true cors proxy is used for article url's.
 * @class
 */
const NewsfeedFetcher = function (url, reloadInterval, encoding, logFeedWarnings, useCorsProxy) {
	let reloadTimer = null;
	let items = [];
	let reloadIntervalMS = reloadInterval;

	let fetchFailedCallback = function () {};
	let itemsReceivedCallback = function () {};

	if (reloadIntervalMS < 1000) {
		reloadIntervalMS = 1000;
	}

	/* private methods */

	/**
	 * Request the new items.
	 */
	const fetchNews = () => {
		clearTimeout(reloadTimer);
		reloadTimer = null;
		items = [];

		const parser = new FeedMe();

		parser.on("item", (item) => {
			const title = item.title;
			let description = item.description || item.summary || item.content || "";
			const pubdate = item.pubdate || item.published || item.updated || item["dc:date"] || item["a10:updated"];
			const url = item.url || item.link || "";

			if (title && pubdate) {
				// Convert HTML entities, codes and tag
				description = htmlToText(description, {
					wordwrap: false,
					selectors: [
						{ selector: "a", options: { ignoreHref: true, noAnchorUrl: true } },
						{ selector: "br", format: "inlineSurround", options: { prefix: " " } },
						{ selector: "img", format: "skip" }
					]
				});

				items.push({
					title: title,
					description: description,
					pubdate: pubdate,
					url: url,
					useCorsProxy: useCorsProxy,
					hash: crypto.createHash("sha256").update(`${pubdate} :: ${title} :: ${url}`).digest("hex")
				});
			} else if (logFeedWarnings) {
				Log.warn("Can't parse feed item:");
				Log.warn(item);
				Log.warn(`Title: ${title}`);
				Log.warn(`Description: ${description}`);
				Log.warn(`Pubdate: ${pubdate}`);
			}
		});

		parser.on("end", () => {
			this.broadcastItems();
		});

		parser.on("error", (error) => {
			fetchFailedCallback(this, error);
			scheduleTimer();
		});

		//"end" event is not broadcast if the feed is empty but "finish" is used for both
		parser.on("finish", () => {
			scheduleTimer();
		});

		parser.on("ttl", (minutes) => {
			try {
				// 86400000 = 24 hours is mentioned in the docs as maximum value:
				const ttlms = Math.min(minutes * 60 * 1000, 86400000);
				if (ttlms > reloadIntervalMS) {
					reloadIntervalMS = ttlms;
					Log.info(`Newsfeed-Fetcher: reloadInterval set to ttl=${reloadIntervalMS} for url ${url}`);
				}
			} catch (error) {
				Log.warn(`Newsfeed-Fetcher: feed ttl is no valid integer=${minutes} for url ${url}`);
			}
		});

		const nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
		const headers = {
			"User-Agent": `Mozilla/5.0 (Node.js ${nodeVersion}) MagicMirror/${global.version}`,
			"Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
			Pragma: "no-cache"
		};

		fetch(url, { headers: headers })
			.then(NodeHelper.checkFetchStatus)
			.then((response) => {
				let nodeStream;
				if (response.body instanceof stream.Readable) {
					nodeStream = response.body;
				} else {
					nodeStream = stream.Readable.fromWeb(response.body);
				}
				nodeStream.pipe(iconv.decodeStream(encoding)).pipe(parser);
			})
			.catch((error) => {
				fetchFailedCallback(this, error);
				scheduleTimer();
			});
	};

	/**
	 * Schedule the timer for the next update.
	 */
	const scheduleTimer = function () {
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function () {
			fetchNews();
		}, reloadIntervalMS);
	};

	/* public methods */

	/**
	 * Update the reload interval, but only if we need to increase the speed.
	 * @param {number} interval Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function (interval) {
		if (interval > 1000 && interval < reloadIntervalMS) {
			reloadIntervalMS = interval;
		}
	};

	/**
	 * Initiate fetchNews();
	 */
	this.startFetch = function () {
		fetchNews();
	};

	/**
	 * Broadcast the existing items.
	 */
	this.broadcastItems = function () {
		if (items.length <= 0) {
			Log.info("Newsfeed-Fetcher: No items to broadcast yet.");
			return;
		}
		Log.info(`Newsfeed-Fetcher: Broadcasting ${items.length} items.`);
		itemsReceivedCallback(this);
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

module.exports = NewsfeedFetcher;
