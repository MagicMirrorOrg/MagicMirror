import crypto from "node:crypto";
import stream from "node:stream";
import FeedMe from "feedme";
import iconv from "iconv-lite";
import { htmlToText } from "html-to-text";
import Log from "logger";
import HTTPFetcher from "#http_fetcher";

/**
 * NewsfeedFetcher - Fetches and parses RSS/Atom feed data
 * Uses HTTPFetcher for HTTP handling with intelligent error handling
 * @class
 */
class NewsfeedFetcher {

	url: string;

	encoding: string;

	logFeedWarnings: boolean;

	useCorsProxy: boolean;

	items: NewsItem[];

	fetchFailedCallback: (fetcher: NewsfeedFetcher, errorInfo: any) => void;

	itemsReceivedCallback: (fetcher: NewsfeedFetcher) => void;

	httpFetcher: HTTPFetcher;

	/**
	 * Creates a new NewsfeedFetcher instance
	 * @param {string} url - The URL of the news feed to fetch
	 * @param {number} reloadInterval - Time in ms between fetches
	 * @param {string} encoding - Encoding of the feed (e.g., 'UTF-8')
	 * @param {boolean} logFeedWarnings - If true log warnings when there is an error parsing a news article
	 * @param {boolean} useCorsProxy - If true cors proxy is used for article url's
	 */
	constructor (url: string, reloadInterval: number, encoding: string, logFeedWarnings: boolean, useCorsProxy: boolean) {
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
		this.httpFetcher.on("response", (response: any) => void this.#handleResponse(response));
		this.httpFetcher.on("error", (errorInfo: any) => this.fetchFailedCallback(this, errorInfo));
	}

	/**
	 * Creates a parse error info object
	 * @param {string} message - Error message
	 * @param {Error} error - Original error
	 * @returns {object} Error info object
	 */
	#createParseError (message: string, error: Error): object {
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
	async #handleResponse (response: any): Promise<void> {
		this.items = [];
		const parser = new FeedMe();

		parser.on("item", (item: any) => {
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

		parser.on("ttl", (minutes: number) => {
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
			await stream.promises.pipeline(nodeStream, iconv.decodeStream(this.encoding), parser);
		} catch (error) {
			Log.error(`${this.url} - Stream processing failed: ${(error as Error).message}`);
			this.fetchFailedCallback(this, this.#createParseError(`Stream processing failed: ${(error as Error).message}`, error as Error));
		}
	}

	/**
	 * Update the reload interval, but only if we need to increase the speed.
	 * @param {number} interval - Interval for the update in milliseconds.
	 */
	setReloadInterval (interval: number): void {
		if (interval > 1000 && interval < this.httpFetcher.reloadInterval) {
			this.httpFetcher.reloadInterval = interval;
		}
	}

	startFetch (): void {
		this.httpFetcher.startPeriodicFetch();
	}

	broadcastItems (): void {
		if (this.items.length <= 0) {
			Log.info("No items to broadcast yet.");
			return;
		}
		Log.info(`Broadcasting ${this.items.length} items.`);
		this.itemsReceivedCallback(this);
	}

	/** @param {function(NewsfeedFetcher): void} callback - Called when items are received */
	onReceive (callback: (fetcher: NewsfeedFetcher) => void): void {
		this.itemsReceivedCallback = callback;
	}

	/** @param {function(NewsfeedFetcher, object): void} callback - Called on fetch error */
	onError (callback: (fetcher: NewsfeedFetcher, errorInfo: any) => void): void {
		this.fetchFailedCallback = callback;
	}
}

export = NewsfeedFetcher;
