const { EventEmitter } = require("node:events");
const { fetch: undiciFetch, Agent } = require("undici");
const Log = require("logger");
const { getUserAgent } = require("#server_functions");

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const MAX_SERVER_BACKOFF = 3;
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Maps errorType to MagicMirror translation keys.
 * This allows HTTPFetcher to provide ready-to-use translation keys,
 * eliminating the need to call NodeHelper.checkFetchError().
 */
const ERROR_TYPE_TO_TRANSLATION = {
	AUTH_FAILURE: "MODULE_ERROR_UNAUTHORIZED",
	RATE_LIMITED: "MODULE_ERROR_RATE_LIMITED",
	SERVER_ERROR: "MODULE_ERROR_SERVER_ERROR",
	CLIENT_ERROR: "MODULE_ERROR_CLIENT_ERROR",
	NETWORK_ERROR: "MODULE_ERROR_NO_CONNECTION",
	UNKNOWN_ERROR: "MODULE_ERROR_UNSPECIFIED"
};

/**
 * HTTPFetcher - Centralized HTTP fetching with intelligent error handling
 *
 * Features:
 * - Automatic retry strategies based on HTTP status codes
 * - Exponential backoff for server errors
 * - Retry-After header parsing for rate limiting
 * - Authentication support (Basic, Bearer)
 * - Self-signed certificate support
 * @augments EventEmitter
 * @fires HTTPFetcher#response - When fetch succeeds with ok response
 * @fires HTTPFetcher#error - When fetch fails or returns non-ok response
 * @example
 * const fetcher = new HTTPFetcher(url, { reloadInterval: 60000 });
 * fetcher.on('response', (response) => { ... });
 * fetcher.on('error', (errorInfo) => { ... });
 * fetcher.startPeriodicFetch();
 */
class HTTPFetcher extends EventEmitter {

	/**
	 * Calculates exponential backoff delay for retries
	 * @param {number} attempt - Attempt number (1-based)
	 * @param {object} options - Configuration options
	 * @param {number} [options.baseDelay] - Initial delay in ms (default: 15s)
	 * @param {number} [options.maxDelay] - Maximum delay in ms (default: 5min)
	 * @returns {number} Delay in milliseconds
	 * @example
	 * HTTPFetcher.calculateBackoffDelay(1) // 15000 (15s)
	 * HTTPFetcher.calculateBackoffDelay(2) // 30000 (30s)
	 * HTTPFetcher.calculateBackoffDelay(3) // 60000 (60s)
	 * HTTPFetcher.calculateBackoffDelay(6) // 300000 (5min, capped)
	 */
	static calculateBackoffDelay (attempt, { baseDelay = 15000, maxDelay = 300000 } = {}) {
		return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
	}

	/**
	 * Creates a new HTTPFetcher instance
	 * @param {string} url - The URL to fetch
	 * @param {object} options - Configuration options
	 * @param {number} [options.reloadInterval] - Time in ms between fetches (default: 5 min)
	 * @param {object} [options.auth] - Authentication options
	 * @param {string} [options.auth.method] - 'basic' or 'bearer'
	 * @param {string} [options.auth.user] - Username for basic auth
	 * @param {string} [options.auth.pass] - Password or token
	 * @param {boolean} [options.selfSignedCert] - Accept self-signed certificates
	 * @param {object} [options.headers] - Additional headers to send
	 * @param {number} [options.maxRetries] - Max retries for 5xx errors (default: 3)
	 * @param {number} [options.timeout] - Request timeout in ms (default: 30000)
	 * @param {string} [options.logContext] - Optional context for log messages (e.g., provider name)
	 */
	constructor (url, options = {}) {
		super();

		this.url = url;
		this.reloadInterval = options.reloadInterval || 5 * 60 * 1000;
		this.auth = options.auth || null;
		this.selfSignedCert = options.selfSignedCert || false;
		this.customHeaders = options.headers || {};
		this.maxRetries = options.maxRetries || MAX_SERVER_BACKOFF;
		this.timeout = options.timeout || DEFAULT_TIMEOUT;
		this.logContext = options.logContext ? `[${options.logContext}] ` : "";

		this.reloadTimer = null;
		this.serverErrorCount = 0;
		this.networkErrorCount = 0;
	}

	/**
	 * Clears any pending reload timer
	 */
	clearTimer () {
		if (this.reloadTimer) {
			clearTimeout(this.reloadTimer);
			this.reloadTimer = null;
		}
	}

	/**
	 * Schedules the next fetch.
	 * If no delay is provided, uses reloadInterval.
	 * If delay is provided but very short (< 1 second), clamps to reloadInterval
	 * to prevent hammering servers.
	 * @param {number} [delay] - Delay in milliseconds
	 */
	scheduleNextFetch (delay) {
		let nextDelay = delay ?? this.reloadInterval;

		// Only clamp if delay is unreasonably short (< 1 second)
		// This allows respecting Retry-After headers while preventing abuse
		if (nextDelay < 1000) {
			nextDelay = this.reloadInterval;
		}

		// Don't schedule in test mode
		if (process.env.mmTestMode === "true") {
			return;
		}

		this.reloadTimer = setTimeout(() => this.fetch(), nextDelay);
	}

	/**
	 * Starts periodic fetching
	 */
	startPeriodicFetch () {
		this.fetch();
	}

	/**
	 * Builds the options object for fetch
	 * @returns {object} Options object containing headers (and dispatcher if needed)
	 */
	getRequestOptions () {
		const headers = {
			"User-Agent": getUserAgent(),
			...this.customHeaders
		};
		const options = { headers };

		if (this.selfSignedCert) {
			options.dispatcher = new Agent({
				connect: {
					rejectUnauthorized: false
				}
			});
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
	#parseRetryAfter (retryAfter) {
		// Try parsing as seconds
		const seconds = Number(retryAfter);
		if (!Number.isNaN(seconds) && seconds >= 0) {
			return seconds * 1000;
		}

		// Try parsing as HTTP-date
		const retryDate = Date.parse(retryAfter);
		if (!Number.isNaN(retryDate)) {
			return Math.max(0, retryDate - Date.now());
		}

		return null;
	}

	/**
	 * Determines the retry delay for a non-ok response
	 * @param {Response} response - The fetch Response object
	 * @returns {{delay: number, errorInfo: object}} Computed retry delay and error info
	 */
	#getDelayForResponse (response) {
		const { status } = response;
		let delay = this.reloadInterval;
		let message;
		let errorType = "UNKNOWN_ERROR";

		if (status === 401 || status === 403) {
			errorType = "AUTH_FAILURE";
			delay = Math.max(this.reloadInterval * 5, THIRTY_MINUTES);
			message = `Authentication failed (${status}). Check your API key. Waiting ${Math.round(delay / 60000)} minutes before retry.`;
			Log.error(`${this.logContext}${this.url} - ${message}`);
		} else if (status === 429) {
			errorType = "RATE_LIMITED";
			const retryAfter = response.headers.get("retry-after");
			const parsed = retryAfter ? this.#parseRetryAfter(retryAfter) : null;
			delay = parsed !== null ? Math.max(parsed, this.reloadInterval) : Math.max(this.reloadInterval * 2, FIFTEEN_MINUTES);
			message = `Rate limited (429). Retrying in ${Math.round(delay / 60000)} minutes.`;
			Log.warn(`${this.logContext}${this.url} - ${message}`);
		} else if (status >= 500) {
			errorType = "SERVER_ERROR";
			this.serverErrorCount = Math.min(this.serverErrorCount + 1, this.maxRetries);
			delay = this.reloadInterval * Math.pow(2, this.serverErrorCount);
			message = `Server error (${status}). Retry #${this.serverErrorCount} in ${Math.round(delay / 60000)} minutes.`;
			Log.error(`${this.logContext}${this.url} - ${message}`);
		} else if (status >= 400) {
			errorType = "CLIENT_ERROR";
			delay = Math.max(this.reloadInterval * 2, FIFTEEN_MINUTES);
			message = `Client error (${status}). Retrying in ${Math.round(delay / 60000)} minutes.`;
			Log.error(`${this.logContext}${this.url} - ${message}`);
		} else {
			message = `Unexpected HTTP status ${status}.`;
			Log.error(`${this.logContext}${this.url} - ${message}`);
		}

		return {
			delay,
			errorInfo: this.#createErrorInfo(message, status, errorType, delay)
		};
	}

	/**
	 * Creates a standardized error info object
	 * @param {string} message - Error message
	 * @param {number|null} status - HTTP status code or null for network errors
	 * @param {string} errorType - Error type: AUTH_FAILURE, RATE_LIMITED, SERVER_ERROR, CLIENT_ERROR, NETWORK_ERROR
	 * @param {number} retryAfter - Delay until next retry in ms
	 * @param {Error} [originalError] - The original error if any
	 * @returns {object} Error info object with translationKey for direct use
	 */
	#createErrorInfo (message, status, errorType, retryAfter, originalError = null) {
		return {
			message,
			status,
			errorType,
			translationKey: ERROR_TYPE_TO_TRANSLATION[errorType] || "MODULE_ERROR_UNSPECIFIED",
			retryAfter,
			retryCount: errorType === "NETWORK_ERROR" ? this.networkErrorCount : this.serverErrorCount,
			url: this.url,
			originalError
		};
	}

	/**
	 * Performs the HTTP fetch and emits appropriate events
	 * @fires HTTPFetcher#response
	 * @fires HTTPFetcher#error
	 */
	async fetch () {
		this.clearTimer();

		let nextDelay = this.reloadInterval;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const requestOptions = this.getRequestOptions();
			// Use undici.fetch when a custom dispatcher is present (e.g. selfSignedCert),
			// because Node's global fetch and npm undici@8 Agents are incompatible.
			// For regular requests, use globalThis.fetch so MSW and other interceptors work.
			const fetchFn = requestOptions.dispatcher ? undiciFetch : globalThis.fetch;
			const response = await fetchFn(this.url, {
				...requestOptions,
				signal: controller.signal
			});

			const isSuccessfulResponse = response.ok || response.status === 304;

			if (!isSuccessfulResponse) {
				const { delay, errorInfo } = this.#getDelayForResponse(response);
				nextDelay = delay;
				this.emit("error", errorInfo);
			} else {
				// Reset error counts on success
				this.serverErrorCount = 0;
				this.networkErrorCount = 0;

				/**
				 * Response event - fired when fetch succeeds
				 * @event HTTPFetcher#response
				 * @type {Response}
				 */
				this.emit("response", response);
			}
		} catch (error) {
			const isTimeout = error.name === "AbortError";
			const message = isTimeout ? `Request timeout after ${this.timeout}ms` : `Network error: ${error.message}`;

			// Apply exponential backoff for network errors
			this.networkErrorCount = Math.min(this.networkErrorCount + 1, this.maxRetries);
			const backoffDelay = HTTPFetcher.calculateBackoffDelay(this.networkErrorCount, {
				maxDelay: this.reloadInterval
			});
			nextDelay = backoffDelay;

			// Truncate URL for cleaner logs
			let shortUrl = this.url;
			try {
				const urlObj = new URL(this.url);
				shortUrl = `${urlObj.origin}${urlObj.pathname}${urlObj.search.length > 50 ? "?..." : urlObj.search}`;
			} catch {
				// If URL parsing fails, use original URL
			}

			// Gradual log-level escalation: WARN for first 2 attempts, ERROR after
			const retryMessage = `Retry #${this.networkErrorCount} in ${Math.round(nextDelay / 1000)}s.`;
			if (this.networkErrorCount <= 2) {
				Log.warn(`${this.logContext}${shortUrl} - ${message} ${retryMessage}`);
			} else {
				Log.error(`${this.logContext}${shortUrl} - ${message} ${retryMessage}`);
			}

			const errorInfo = this.#createErrorInfo(
				message,
				null,
				"NETWORK_ERROR",
				nextDelay,
				error
			);

			/**
			 * Error event - fired when fetch fails
			 * @event HTTPFetcher#error
			 * @type {object}
			 * @property {string} message - Error description
			 * @property {number|null} statusCode - HTTP status or null for network errors
			 * @property {number} retryDelay - Ms until next retry
			 * @property {number} retryCount - Number of consecutive server errors
			 * @property {string} url - The URL that was fetched
			 * @property {Error|null} originalError - The original error
			 */
			this.emit("error", errorInfo);
		} finally {
			clearTimeout(timeoutId);
		}

		this.scheduleNextFetch(nextDelay);
	}
}

module.exports = HTTPFetcher;
