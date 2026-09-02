const Log = require("logger");
const HTTPFetcher = require("#http_fetcher");

/**
 * Base class for server-side weather providers.
 *
 * Centralizes the HTTPFetcher lifecycle (start, stop, callbacks) and standard
 * JSON-over-HTTP handling: 304 Not Modified, JSON parse errors, HTTP errors.
 * Providers extend this class and call _createJSONFetcher() in their initialize().
 */
class WeatherProvider {

	constructor () {
		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
		this.locationName = null;
	}

	/**
	 * Sets the callbacks used to deliver data and report errors.
	 * Must be called before initialize().
	 * @param {(data: object) => void} onData - Called with the parsed weather data object
	 * @param {(error: object) => void} onError - Called with an error info object
	 */
	setCallbacks (onData, onError) {
		this.onDataCallback = onData;
		this.onErrorCallback = onError;
	}

	/**
	 * Start periodic fetching.
	 * @param {number} [initialDelay] - Delay before the first fetch in ms
	 */
	start (initialDelay = 0) {
		this.fetcher?.startPeriodicFetch(initialDelay);
	}

	/** Stop periodic fetching. */
	stop () {
		this.fetcher?.clearTimer();
	}

	/**
	 * Creates an HTTPFetcher for a JSON API, stores it as this.fetcher, and wires
	 * up response/error handling centrally:
	 * - HTTP 304 Not Modified: skips parsing, keeps existing data on screen
	 * - JSON parse failures: calls onError without clearing existing data
	 * - HTTP errors: forwarded directly to onError
	 * @param {string} url - The URL to fetch
	 * @param {object} options - Options forwarded to HTTPFetcher
	 * @param {(data: object) => void} onData - Called with the parsed JSON object on success
	 */
	_createJSONFetcher (url, options, onData) {
		this.fetcher = new HTTPFetcher(url, options);

		this.fetcher.on("response", async (response) => {
			// 304 has no body — skip parsing, keep existing data
			if (response.status === 304) return;

			let data;
			try {
				data = await response.json();
			} catch (error) {
				Log.error(`[${this.constructor.name}] Failed to parse JSON:`, error);
				this.onErrorCallback?.({
					message: "Failed to parse API response",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
				return;
			}

			try {
				onData(data);
			} catch (error) {
				Log.error(`[${this.constructor.name}] Failed to process weather data:`, error);
				this.onErrorCallback?.({
					message: "Failed to process weather data",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
		});

		this.fetcher.on("error", (errorInfo) => {
			this.onErrorCallback?.(errorInfo);
		});
	}
}

module.exports = WeatherProvider;
