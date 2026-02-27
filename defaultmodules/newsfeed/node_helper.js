const NodeHelper = require("node_helper");
const Log = require("logger");
const NewsfeedFetcher = require("./newsfeedfetcher");

module.exports = NodeHelper.create({
	// Override start method.
	start () {
		Log.log(`Starting node helper for: ${this.name}`);
		this.fetchers = [];
	},

	// Override socketNotificationReceived received.
	socketNotificationReceived (notification, payload) {
		if (notification === "ADD_FEED") {
			this.createFetcher(payload.feed, payload.config);
		} else if (notification === "CHECK_ARTICLE_URL") {
			this.checkArticleUrl(payload.url);
		}
	},

	/**
	 * Checks whether a URL can be displayed in an iframe by inspecting
	 * X-Frame-Options and Content-Security-Policy headers server-side.
	 * @param {string} url The article URL to check.
	 */
	async checkArticleUrl (url) {
		try {
			const response = await fetch(url, { method: "HEAD" });
			const xfo = response.headers.get("x-frame-options");
			const csp = response.headers.get("content-security-policy");
			// sameorigin also blocks since the article is on a different origin than MM
			const blockedByXFO = xfo && ["deny", "sameorigin"].includes(xfo.toLowerCase().trim());
			const blockedByCSP = csp && (/frame-ancestors\s+['"]?none['"]?/).test(csp);
			this.sendSocketNotification("ARTICLE_URL_STATUS", { url, canFrame: !blockedByXFO && !blockedByCSP });
		} catch {
			// Network error or HEAD not supported — let the browser try the iframe anyway
			this.sendSocketNotification("ARTICLE_URL_STATUS", { url, canFrame: true });
		}
	},

	/**
	 * Creates a fetcher for a new feed if it doesn't exist yet.
	 * Otherwise it reuses the existing one.
	 * @param {object} feed The feed object
	 * @param {object} config The configuration object
	 */
	createFetcher (feed, config) {
		const url = feed.url || "";
		const encoding = feed.encoding || "UTF-8";
		const reloadInterval = feed.reloadInterval || config.reloadInterval || 5 * 60 * 1000;
		const useCorsProxy = feed.useCorsProxy ?? true;

		try {
			new URL(url);
		} catch (error) {
			Log.error("Error: Malformed newsfeed url: ", url, error);
			this.sendSocketNotification("NEWSFEED_ERROR", { error_type: "MODULE_ERROR_MALFORMED_URL" });
			return;
		}

		let fetcher;
		if (typeof this.fetchers[url] === "undefined") {
			Log.log(`Create new newsfetcher for url: ${url} - Interval: ${reloadInterval}`);
			fetcher = new NewsfeedFetcher(url, reloadInterval, encoding, config.logFeedWarnings, useCorsProxy);

			fetcher.onReceive(() => {
				this.broadcastFeeds();
			});

			fetcher.onError((fetcher, errorInfo) => {
				Log.error("Error: Could not fetch newsfeed: ", fetcher.url, errorInfo.message || errorInfo);
				this.sendSocketNotification("NEWSFEED_ERROR", {
					error_type: errorInfo.translationKey
				});
			});

			this.fetchers[url] = fetcher;
		} else {
			Log.log(`Use existing newsfetcher for url: ${url}`);
			fetcher = this.fetchers[url];
			fetcher.setReloadInterval(reloadInterval);
			fetcher.broadcastItems();
		}

		fetcher.startFetch();
	},

	/**
	 * Creates an object with all feed items of the different registered feeds,
	 * and broadcasts these using sendSocketNotification.
	 */
	broadcastFeeds () {
		const feeds = {};
		for (const url in this.fetchers) {
			feeds[url] = this.fetchers[url].items;
		}
		this.sendSocketNotification("NEWS_ITEMS", feeds);
	}
});
