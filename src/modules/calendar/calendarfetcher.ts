import ical from "node-ical";
import Log from "logger";
import CalendarFetcherUtils from "./calendarfetcherutils";
import HTTPFetcher from "#http_fetcher";

/**
 * CalendarFetcher - Fetches and parses iCal calendar data
 * Uses HTTPFetcher for HTTP handling with intelligent error handling
 * @class
 */
class CalendarFetcher {

	url: string;

	excludedEvents: string[];

	maximumEntries: number;

	maximumNumberOfDays: number;

	includePastEvents: boolean;

	events: CalendarEvent[];

	lastFetch: number | null;

	fetchFailedCallback: (...args: any[]) => void;

	eventsReceivedCallback: (...args: any[]) => void;

	httpFetcher: HTTPFetcher;

	/**
	 * Creates a new CalendarFetcher instance
	 * @param {string} url - The URL of the calendar to fetch
	 * @param {number} reloadInterval - Time in ms between fetches
	 * @param {string[]} excludedEvents - Event titles to exclude
	 * @param {number} maximumEntries - Maximum number of events to return
	 * @param {number} maximumNumberOfDays - Maximum days in the future to fetch
	 * @param {object} auth - Authentication options {method: 'basic'|'bearer', user, pass}
	 * @param {boolean} includePastEvents - Whether to include past events
	 * @param {boolean} selfSignedCert - Whether to accept self-signed certificates
	 */
	constructor (url: string, reloadInterval: number, excludedEvents: string[], maximumEntries: number, maximumNumberOfDays: number, auth: any, includePastEvents: boolean, selfSignedCert: boolean) {
		this.url = url;
		this.excludedEvents = excludedEvents;
		this.maximumEntries = maximumEntries;
		this.maximumNumberOfDays = maximumNumberOfDays;
		this.includePastEvents = includePastEvents;

		this.events = [];
		this.lastFetch = null;
		this.fetchFailedCallback = () => {};
		this.eventsReceivedCallback = () => {};

		// Use HTTPFetcher for HTTP handling (Composition)
		this.httpFetcher = new HTTPFetcher(url, {
			reloadInterval,
			auth,
			selfSignedCert
		});

		// Wire up HTTPFetcher events
		this.httpFetcher.on("response", (response: any) => this.#handleResponse(response));
		this.httpFetcher.on("error", (errorInfo: any) => this.fetchFailedCallback(this, errorInfo));
	}

	/**
	 * Handles successful HTTP response
	 * @param {Response} response - The fetch Response object
	 */
	async #handleResponse (response: any): Promise<void> {
		try {
			const responseData = await response.text();
			const parsed = ical.parseICS(responseData);

			Log.debug(`Parsed iCal data from ${this.url} with ${Object.keys(parsed).length} entries.`);

			this.events = CalendarFetcherUtils.filterEvents(parsed, {
				excludedEvents: this.excludedEvents,
				includePastEvents: this.includePastEvents,
				maximumEntries: this.maximumEntries,
				maximumNumberOfDays: this.maximumNumberOfDays
			});

			this.lastFetch = Date.now();
			this.broadcastEvents();
		} catch (error) {
			Log.error(`${this.url} - iCal parsing failed: ${(error as Error).message}`);
			this.fetchFailedCallback(this, {
				message: `iCal parsing failed: ${(error as Error).message}`,
				status: null,
				errorType: "PARSE_ERROR",
				translationKey: "MODULE_ERROR_UNSPECIFIED",
				retryAfter: this.httpFetcher.reloadInterval,
				retryCount: 0,
				url: this.url,
				originalError: error
			});
		}
	}

	/**
	 * Starts fetching calendar data
	 */
	fetchCalendar (): void {
		this.httpFetcher.startPeriodicFetch();
	}

	/**
	 * Check if enough time has passed since the last fetch to warrant a new one.
	 * Uses reloadInterval as the threshold to respect user's configured fetchInterval.
	 * @returns {boolean} True if a new fetch should be performed
	 */
	shouldRefetch (): boolean {
		if (!this.lastFetch) {
			return true;
		}
		const timeSinceLastFetch = Date.now() - this.lastFetch;
		return timeSinceLastFetch >= this.httpFetcher.reloadInterval;
	}

	/**
	 * Broadcasts the current events to listeners
	 */
	broadcastEvents (): void {
		Log.info(`Broadcasting ${this.events.length} events from ${this.url}.`);
		this.eventsReceivedCallback(this);
	}

	/**
	 * Sets the callback for successful event fetches
	 * @param {(fetcher: CalendarFetcher) => void} callback - Called when events are received
	 */
	onReceive (callback: (fetcher: CalendarFetcher) => void): void {
		this.eventsReceivedCallback = callback;
	}

	/**
	 * Sets the callback for fetch failures
	 * @param {(fetcher: CalendarFetcher, error: Error) => void} callback - Called when a fetch fails
	 */
	onError (callback: (fetcher: CalendarFetcher, error: Error) => void): void {
		this.fetchFailedCallback = callback;
	}
}

export = CalendarFetcher;
