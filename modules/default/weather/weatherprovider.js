/* global Class */

/* MagicMirror²
 * Module: Weather
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 *
 * This class is the blueprint for a weather provider.
 */
const WeatherProvider = Class.extend({
	// Weather Provider Properties
	providerName: null,
	defaults: {},

	// The following properties have accessor methods.
	// Try to not access them directly.
	currentWeatherObject: null,
	weatherForecastArray: null,
	weatherHourlyArray: null,
	fetchedLocationName: null,

	// The following properties will be set automatically.
	// You do not need to overwrite these properties.
	config: null,
	delegate: null,
	providerIdentifier: null,

	// Weather Provider Methods
	// All the following methods can be overwritten, although most are good as they are.

	// Called when a weather provider is initialized.
	init: function (config) {
		this.config = config;
		Log.info(`Weather provider: ${this.providerName} initialized.`);
	},

	// Called to set the config, this config is the same as the weather module's config.
	setConfig: function (config) {
		this.config = config;
		Log.info(`Weather provider: ${this.providerName} config set.`, this.config);
	},

	// Called when the weather provider is about to start.
	start: function () {
		Log.info(`Weather provider: ${this.providerName} started.`);
	},

	// This method should start the API request to fetch the current weather.
	// This method should definitely be overwritten in the provider.
	fetchCurrentWeather: function () {
		Log.warn(`Weather provider: ${this.providerName} does not subclass the fetchCurrentWeather method.`);
	},

	// This method should start the API request to fetch the weather forecast.
	// This method should definitely be overwritten in the provider.
	fetchWeatherForecast: function () {
		Log.warn(`Weather provider: ${this.providerName} does not subclass the fetchWeatherForecast method.`);
	},

	// This method should start the API request to fetch the weather hourly.
	// This method should definitely be overwritten in the provider.
	fetchWeatherHourly: function () {
		Log.warn(`Weather provider: ${this.providerName} does not subclass the fetchWeatherHourly method.`);
	},

	// This returns a WeatherDay object for the current weather.
	currentWeather: function () {
		return this.currentWeatherObject;
	},

	// This returns an array of WeatherDay objects for the weather forecast.
	weatherForecast: function () {
		return this.weatherForecastArray;
	},

	// This returns an object containing WeatherDay object(s) depending on the type of call.
	weatherHourly: function () {
		return this.weatherHourlyArray;
	},

	// This returns the name of the fetched location or an empty string.
	fetchedLocation: function () {
		return this.fetchedLocationName || "";
	},

	// Set the currentWeather and notify the delegate that new information is available.
	setCurrentWeather: function (currentWeatherObject) {
		// We should check here if we are passing a WeatherDay
		this.currentWeatherObject = currentWeatherObject;
	},

	// Set the weatherForecastArray and notify the delegate that new information is available.
	setWeatherForecast: function (weatherForecastArray) {
		// We should check here if we are passing a WeatherDay
		this.weatherForecastArray = weatherForecastArray;
	},

	// Set the weatherHourlyArray and notify the delegate that new information is available.
	setWeatherHourly: function (weatherHourlyArray) {
		this.weatherHourlyArray = weatherHourlyArray;
	},

	// Set the fetched location name.
	setFetchedLocation: function (name) {
		this.fetchedLocationName = name;
	},

	// Notify the delegate that new weather is available.
	updateAvailable: function () {
		this.delegate.updateAvailable(this);
	},

	/**
	 * A convenience function to make requests.
	 *
	 * @param {string} url the url to fetch from
	 * @param {string} type what contenttype to expect in the response, can be "json" or "xml"
	 * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
	 * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to recieve
	 * @returns {Promise} resolved when the fetch is done
	 */
	fetchData: async function (url, type = "json", requestHeaders = undefined, expectedResponseHeaders = undefined) {
		url = this.getCorsUrl(url, requestHeaders, expectedResponseHeaders);
		const mockData = this.config.mockData;
		if (mockData) {
			const data = mockData.substring(1, mockData.length - 1);
			return JSON.parse(data);
		} else {
			const response = await fetch(url);
			const data = await response.text();

			if (type === "xml") {
				return new DOMParser().parseFromString(data, "text/html");
			} else {
				if (!data || !data.length > 0) return undefined;

				const dataResponse = JSON.parse(data);
				if (!dataResponse.headers) {
					dataResponse.headers = this.getHeadersFromResponse(expectedResponseHeaders, response);
				}
				return dataResponse;
			}
		}
	},

	/**
	 * Gets a URL that will be used when calling the CORS-method on the server.
	 *
	 * @param {string} url the url to fetch from
	 * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
	 * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to recieve
	 * @returns {string} to be used as URL when calling CORS-method on server.
	 */
	getCorsUrl: function (url, requestHeaders, expectedResponseHeaders) {
		if (this.config.mockData || typeof this.config.useCorsProxy === "undefined" || !this.config.useCorsProxy) {
			return "";
		} else if (!url || url.length < 1) {
			throw new Error(`Invalid URL: ${url}`);
		} else {
			let corsUrl = `${location.protocol}//${location.host}/cors?`;

			const requestHeaderString = this.getRequestHeaderString(requestHeaders);
			if (requestHeaderString) corsUrl = `${corsUrl}sendheaders=${requestHeaderString}`;

			const expectedResponseHeadersString = this.getExpectedResponseHeadersString(expectedResponseHeaders);
			if (requestHeaderString && expectedResponseHeadersString) {
				corsUrl = `${corsUrl}&expectedheaders=${expectedResponseHeadersString}`;
			} else if (expectedResponseHeadersString) {
				corsUrl = `${corsUrl}expectedheaders=${expectedResponseHeadersString}`;
			}

			if (requestHeaderString || expectedResponseHeadersString) {
				return `${corsUrl}&url=${url}`;
			}
			return `${corsUrl}url=${url}`;
		}
	},

	/**
	 * Gets the part of the CORS URL that represents the HTTP headers to send.
	 *
	 * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
	 * @returns {string} to be used as request-headers component in CORS URL.
	 */
	getRequestHeaderString: function (requestHeaders) {
		let requestHeaderString = "";
		if (requestHeaders) {
			for (const header of requestHeaders) {
				if (requestHeaderString.length === 0) {
					requestHeaderString = `${header.name}:${encodeURIComponent(header.value)}`;
				} else {
					requestHeaderString = `${requestHeaderString},${header.name}:${encodeURIComponent(header.value)}`;
				}
			}
			return requestHeaderString;
		}
		return undefined;
	},

	/**
	 * Gets the part of the CORS URL that represents the expected HTTP headers to recieve.
	 *
	 * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to recieve
	 * @returns {string} to be used as the expected HTTP-headers component in CORS URL.
	 */
	getExpectedResponseHeadersString: function (expectedResponseHeaders) {
		let expectedResponseHeadersString = "";
		if (expectedResponseHeaders) {
			for (const header of expectedResponseHeaders) {
				if (expectedResponseHeadersString.length === 0) {
					expectedResponseHeadersString = `${header}`;
				} else {
					expectedResponseHeadersString = `${expectedResponseHeadersString},${header}`;
				}
			}
			return expectedResponseHeaders;
		}
		return undefined;
	},

	/**
	 * Gets the values for the expected headers from the response.
	 *
	 * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to recieve
	 * @param {Response} response the HTTP response
	 * @returns {string} to be used as the expected HTTP-headers component in CORS URL.
	 */
	getHeadersFromResponse(expectedResponseHeaders, response) {
		const responseHeaders = [];

		if (expectedResponseHeaders) {
			for (const header of expectedResponseHeaders) {
				const headerValue = response.headers.get(header);
				responseHeaders.push({ name: header, value: headerValue });
			}
		}

		return responseHeaders;
	}
});

/**
 * Collection of registered weather providers.
 */
WeatherProvider.providers = [];

/**
 * Static method to register a new weather provider.
 *
 * @param {string} providerIdentifier The name of the weather provider
 * @param {object} providerDetails The details of the weather provider
 */
WeatherProvider.register = function (providerIdentifier, providerDetails) {
	WeatherProvider.providers[providerIdentifier.toLowerCase()] = WeatherProvider.extend(providerDetails);
};

/**
 * Static method to initialize a new weather provider.
 *
 * @param {string} providerIdentifier The name of the weather provider
 * @param {object} delegate The weather module
 * @returns {object} The new weather provider
 */
WeatherProvider.initialize = function (providerIdentifier, delegate) {
	providerIdentifier = providerIdentifier.toLowerCase();

	const provider = new WeatherProvider.providers[providerIdentifier]();
	const config = Object.assign({}, provider.defaults, delegate.config);

	provider.delegate = delegate;
	provider.setConfig(config);

	provider.providerIdentifier = providerIdentifier;
	if (!provider.providerName) {
		provider.providerName = providerIdentifier;
	}

	return provider;
};
