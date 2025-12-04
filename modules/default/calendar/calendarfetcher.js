const https = require("node:https");
const ical = require("node-ical");
const Log = require("logger");
const CalendarFetcherUtils = require("./calendarfetcherutils");
const { getUserAgent } = require("#server_functions");

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const MAX_SERVER_BACKOFF = 3;

/**
 * CalendarFetcher - Fetches and parses iCal calendar data with MagicMirror-focused error handling
 * @class
 */
class CalendarFetcher {

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
	constructor (url, reloadInterval, excludedEvents, maximumEntries, maximumNumberOfDays, auth, includePastEvents, selfSignedCert) {
		this.url = url;
		this.reloadInterval = reloadInterval;
		this.excludedEvents = excludedEvents;
		this.maximumEntries = maximumEntries;
		this.maximumNumberOfDays = maximumNumberOfDays;
		this.auth = auth;
		this.includePastEvents = includePastEvents;
		this.selfSignedCert = selfSignedCert;

		this.events = [];
		this.reloadTimer = null;
		this.serverErrorCount = 0;
		this.lastFetch = null;
		this.fetchFailedCallback = () => {};
		this.eventsReceivedCallback = () => {};
	}

	/**
	 * Clears any pending reload timer
	 */
	clearReloadTimer () {
		if (this.reloadTimer) {
			clearTimeout(this.reloadTimer);
			this.reloadTimer = null;
		}
	}

	/**
	 * Schedules the next fetch respecting MagicMirror test mode
	 * @param {number} delay - Delay in milliseconds
	 */
	scheduleNextFetch (delay) {
		const nextDelay = Math.max(delay || this.reloadInterval, this.reloadInterval);
		if (process.env.mmTestMode === "true") {
			return;
		}
		this.reloadTimer = setTimeout(() => this.fetchCalendar(), nextDelay);
	}

	/**
	 * Builds the options object for fetch
	 * @returns {object} Options object containing headers (and agent if needed)
	 */
	getRequestOptions () {
		const headers = { "User-Agent": getUserAgent() };
		const options = { headers };

		if (this.selfSignedCert) {
			options.agent = new https.Agent({ rejectUnauthorized: false });
		}

		if (this.auth) {
			if (this.auth.method === "bearer") {
				headers.Authorization = `Bearer ${this.auth.pass}`;
			} else {
				headers.Authorization = `Basic ${Buffer.from(`${this.auth.user}:${this.auth.pass}`).toString("base64")}`;
			}
		}

		return options;
	}

	/**
	 * Parses the Retry-After header value
	 * @param {string} retryAfter - The Retry-After header value
	 * @returns {number|null} Milliseconds to wait or null if parsing failed
	 */
	parseRetryAfter (retryAfter) {
		const seconds = Number(retryAfter);
		if (!Number.isNaN(seconds) && seconds >= 0) {
			return seconds * 1000;
		}

		const retryDate = Date.parse(retryAfter);
		if (!Number.isNaN(retryDate)) {
			return Math.max(0, retryDate - Date.now());
		}

		return null;
	}

	/**
	 * Determines the retry delay for a non-ok response
	 * @param {Response} response - The fetch Response object
	 * @returns {{delay: number, error: Error}} Error describing the issue and computed retry delay
	 */
	getDelayForResponse (response) {
		const { status, statusText = "" } = response;
		let delay = this.reloadInterval;

		if (status === 401 || status === 403) {
			delay = Math.max(this.reloadInterval * 5, THIRTY_MINUTES);
			Log.error(`${this.url} - Authentication failed (${status}). Waiting ${Math.round(delay / 60000)} minutes before retry.`);
		} else if (status === 429) {
			const retryAfter = response.headers.get("retry-after");
			const parsed = retryAfter ? this.parseRetryAfter(retryAfter) : null;
			delay = parsed !== null ? Math.max(parsed, this.reloadInterval) : Math.max(this.reloadInterval * 2, FIFTEEN_MINUTES);
			Log.warn(`${this.url} - Rate limited (429). Retrying in ${Math.round(delay / 60000)} minutes.`);
		} else if (status >= 500) {
			this.serverErrorCount = Math.min(this.serverErrorCount + 1, MAX_SERVER_BACKOFF);
			delay = this.reloadInterval * Math.pow(2, this.serverErrorCount);
			Log.error(`${this.url} - Server error (${status}). Retry #${this.serverErrorCount} in ${Math.round(delay / 60000)} minutes.`);
		} else if (status >= 400) {
			delay = Math.max(this.reloadInterval * 2, FIFTEEN_MINUTES);
			Log.error(`${this.url} - Client error (${status}). Retrying in ${Math.round(delay / 60000)} minutes.`);
		} else {
			Log.error(`${this.url} - Unexpected HTTP status ${status}.`);
		}

		return {
			delay,
			error: new Error(`HTTP ${status} ${statusText}`.trim())
		};
	}

	/**
	 * Fetches and processes calendar data
	 */
	async fetchCalendar () {
		this.clearReloadTimer();

		let nextDelay = this.reloadInterval;
		try {
			const response = await fetch(this.url, this.getRequestOptions());
			if (!response.ok) {
				const { delay, error } = this.getDelayForResponse(response);
				nextDelay = delay;
				this.fetchFailedCallback(this, error);
			} else {
				this.serverErrorCount = 0;
				const responseData = await response.text();
				try {
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
					Log.error(`${this.url} - iCal parsing failed: ${error.message}`);
					this.fetchFailedCallback(this, error);
				}
			}
		} catch (error) {
			Log.error(`${this.url} - Fetch failed: ${error.message}`);
			this.fetchFailedCallback(this, error);
		}

		this.scheduleNextFetch(nextDelay);
	}

	/**
	 * Check if enough time has passed since the last fetch to warrant a new one.
	 * Uses reloadInterval as the threshold to respect user's configured fetchInterval.
	 * @returns {boolean} True if a new fetch should be performed
	 */
	shouldRefetch () {
		if (!this.lastFetch) {
			return true;
		}
		const timeSinceLastFetch = Date.now() - this.lastFetch;
		return timeSinceLastFetch >= this.reloadInterval;
	}

	/**
	 * Broadcasts the current events to listeners
	 */
	broadcastEvents () {
		Log.info(`Broadcasting ${this.events.length} events from ${this.url}.`);
		this.eventsReceivedCallback(this);
	}

	/**
	 * Sets the callback for successful event fetches
	 * @param {(fetcher: CalendarFetcher) => void} callback - Called when events are received
	 */
	onReceive (callback) {
		this.eventsReceivedCallback = callback;
	}

	/**
	 * Sets the callback for fetch failures
	 * @param {(fetcher: CalendarFetcher, error: Error) => void} callback - Called when a fetch fails
	 */
	onError (callback) {
		this.fetchFailedCallback = callback;
	}
}

module.exports = CalendarFetcher;
