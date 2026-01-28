const crypto = require("node:crypto");
const stream = require("node:stream");
const FeedMe = require("feedme");
const iconv = require("iconv-lite");
const { htmlToText } = require("html-to-text");
const Log = require("logger");
const HTTPFetcher = require("#http_fetcher");

/**
 * NewsfeedFetcher - Fetches and parses RSS/Atom feed data
 * Uses HTTPFetcher for HTTP handling with intelligent error handling
 * @class
 */
class NewsfeedFetcher {

	/**
	 * Creates a new NewsfeedFetcher instance
	 * @param {string} url - The URL of the news feed to fetch
	 * @param {number} reloadInterval - Time in ms between fetches
	 * @param {string} encoding - Encoding of the feed (e.g., 'UTF-8')
	 * @param {boolean} logFeedWarnings - If true log warnings when there is an error parsing a news article
	 * @param {boolean} useCorsProxy - If true cors proxy is used for article url's
	 */
	constructor (url, reloadInterval, encoding, logFeedWarnings, useCorsProxy) {
		this.url = url;
		this.encoding = encoding;
		this.logFeedWarnings = logFeedWarnings;
		this.useCorsProxy = useCorsProxy;
		this.items = [];
		this.fetchFailedCallback = () => {};
		this.itemsReceivedCallback = () => {};

		// Use HTTPFetcher for HTTP handling (Composition)
		this.httpFetcher = new HTTPFetcher(url, {
			reloadInterval: Math.max(reloadInterval, 1000),
			headers: {
				"Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
				Pragma: "no-cache"
			}
		});

		// Wire up HTTPFetcher events
		this.httpFetcher.on("response", (response) => this.#handleResponse(response));
		this.httpFetcher.on("error", (errorInfo) => this.fetchFailedCallback(this, errorInfo));
	}

	/**
	 * Creates a parse error info object
	 * @param {string} message - Error message
	 * @param {Error} error - Original error
	 * @returns {object} Error info object
	 */
	#createParseError (message, error) {
		return {
			message,
			status: null,
			errorType: "PARSE_ERROR",
			translationKey: "MODULE_ERROR_UNSPECIFIED",
			retryAfter: this.httpFetcher.reloadInterval,
			retryCount: 0,
			url: this.url,
			originalError: error
		};
	}

	/**
	 * Handles successful HTTP response
	 * @param {Response} response - The fetch Response object
	 */
	#handleResponse (response) {
		this.items = [];
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

				this.items.push({
					title,
					description,
					pubdate,
					url,
					useCorsProxy: this.useCorsProxy,
					hash: crypto.createHash("sha256").update(`${pubdate} :: ${title} :: ${url}`).digest("hex")
				});
			} else if (this.logFeedWarnings) {
				Log.warn("Can't parse feed item:", item);
				Log.warn(`Title: ${title}`);
				Log.warn(`Description: ${description}`);
				Log.warn(`Pubdate: ${pubdate}`);
			}
		});

		parser.on("end", () => this.broadcastItems());

		parser.on("error", (error) => {
			Log.error(`${this.url} - Feed parsing failed: ${error.message}`);
			this.fetchFailedCallback(this, this.#createParseError(`Feed parsing failed: ${error.message}`, error));
		});

		parser.on("ttl", (minutes) => {
			const ttlms = Math.min(minutes * 60 * 1000, 86400000);
			if (ttlms > this.httpFetcher.reloadInterval) {
				this.httpFetcher.reloadInterval = ttlms;
				Log.info(`reloadInterval set to ttl=${ttlms} for url ${this.url}`);
			}
		});

		try {
			const nodeStream = response.body instanceof stream.Readable
				? response.body
				: stream.Readable.fromWeb(response.body);
			nodeStream.pipe(iconv.decodeStream(this.encoding)).pipe(parser);
		} catch (error) {
			Log.error(`${this.url} - Stream processing failed: ${error.message}`);
			this.fetchFailedCallback(this, this.#createParseError(`Stream processing failed: ${error.message}`, error));
		}
	}

	/**
	 * Update the reload interval, but only if we need to increase the speed.
	 * @param {number} interval - Interval for the update in milliseconds.
	 */
	setReloadInterval (interval) {
		if (interval > 1000 && interval < this.httpFetcher.reloadInterval) {
			this.httpFetcher.reloadInterval = interval;
		}
	}

	startFetch () {
		this.httpFetcher.startPeriodicFetch();
	}

	broadcastItems () {
		if (this.items.length <= 0) {
			Log.info("No items to broadcast yet.");
			return;
		}
		Log.info(`Broadcasting ${this.items.length} items.`);
		this.itemsReceivedCallback(this);
	}

	/** @param {function(NewsfeedFetcher): void} callback - Called when items are received */
	onReceive (callback) {
		this.itemsReceivedCallback = callback;
	}

	/** @param {function(NewsfeedFetcher, object): void} callback - Called on fetch error */
	onError (callback) {
		this.fetchFailedCallback = callback;
	}
}

module.exports = NewsfeedFetcher;
