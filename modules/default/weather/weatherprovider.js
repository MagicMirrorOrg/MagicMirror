/* global Class, performWebRequest, OverrideWrapper */

// This class is the blueprint for a weather provider.
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
	init (config) {
		this.config = config;
		Log.info(`Weather provider: ${this.providerName} initialized.`);
	},

	// Called to set the config, this config is the same as the weather module's config.
	setConfig (config) {
		this.config = config;
		Log.info(`Weather provider: ${this.providerName} config set.`, this.config);
	},

	// Called when the weather provider is about to start.
	start () {
		Log.info(`Weather provider: ${this.providerName} started.`);
	},

	// This method should start the API request to fetch the current weather.
	// This method should definitely be overwritten in the provider.
	fetchCurrentWeather () {
		Log.warn(`Weather provider: ${this.providerName} does not subclass the fetchCurrentWeather method.`);
	},

	// This method should start the API request to fetch the weather forecast.
	// This method should definitely be overwritten in the provider.
	fetchWeatherForecast () {
		Log.warn(`Weather provider: ${this.providerName} does not subclass the fetchWeatherForecast method.`);
	},

	// This method should start the API request to fetch the weather hourly.
	// This method should definitely be overwritten in the provider.
	fetchWeatherHourly () {
		Log.warn(`Weather provider: ${this.providerName} does not subclass the fetchWeatherHourly method.`);
	},

	// This returns a WeatherDay object for the current weather.
	currentWeather () {
		return this.currentWeatherObject;
	},

	// This returns an array of WeatherDay objects for the weather forecast.
	weatherForecast () {
		return this.weatherForecastArray;
	},

	// This returns an object containing WeatherDay object(s) depending on the type of call.
	weatherHourly () {
		return this.weatherHourlyArray;
	},

	// This returns the name of the fetched location or an empty string.
	fetchedLocation () {
		return this.fetchedLocationName || "";
	},

	// Set the currentWeather and notify the delegate that new information is available.
	setCurrentWeather (currentWeatherObject) {
		// We should check here if we are passing a WeatherDay
		this.currentWeatherObject = currentWeatherObject;
	},

	// Set the weatherForecastArray and notify the delegate that new information is available.
	setWeatherForecast (weatherForecastArray) {
		// We should check here if we are passing a WeatherDay
		this.weatherForecastArray = weatherForecastArray;
	},

	// Set the weatherHourlyArray and notify the delegate that new information is available.
	setWeatherHourly (weatherHourlyArray) {
		this.weatherHourlyArray = weatherHourlyArray;
	},

	// Set the fetched location name.
	setFetchedLocation (name) {
		this.fetchedLocationName = name;
	},

	// Notify the delegate that new weather is available.
	updateAvailable () {
		this.delegate.updateAvailable(this);
	},

	/**
	 * A convenience function to make requests.
	 * @param {string} url the url to fetch from
	 * @param {string} type what contenttype to expect in the response, can be "json" or "xml"
	 * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
	 * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to recieve
	 * @returns {Promise} resolved when the fetch is done
	 */
	async fetchData (url, type = "json", requestHeaders = undefined, expectedResponseHeaders = undefined) {
		const mockData = this.config.mockData;
		if (mockData) {
			const data = mockData.substring(1, mockData.length - 1);
			return JSON.parse(data);
		}
		const useCorsProxy = typeof this.config.useCorsProxy !== "undefined" && this.config.useCorsProxy;
		return performWebRequest(url, type, useCorsProxy, requestHeaders, expectedResponseHeaders, config.basePath);
	}
});

/**
 * Collection of registered weather providers.
 */
WeatherProvider.providers = [];

/**
 * Static method to register a new weather provider.
 * @param {string} providerIdentifier The name of the weather provider
 * @param {object} providerDetails The details of the weather provider
 */
WeatherProvider.register = function (providerIdentifier, providerDetails) {
	WeatherProvider.providers[providerIdentifier.toLowerCase()] = WeatherProvider.extend(providerDetails);
};

/**
 * Static method to initialize a new weather provider.
 * @param {string} providerIdentifier The name of the weather provider
 * @param {object} delegate The weather module
 * @returns {object} The new weather provider
 */
WeatherProvider.initialize = function (providerIdentifier, delegate) {
	const pi = providerIdentifier.toLowerCase();

	const provider = new WeatherProvider.providers[pi]();
	const config = Object.assign({}, provider.defaults, delegate.config);

	provider.delegate = delegate;
	provider.setConfig(config);

	provider.providerIdentifier = pi;
	if (!provider.providerName) {
		provider.providerName = pi;
	}

	if (config.allowOverrideNotification) {
		return new OverrideWrapper(provider);
	}

	return provider;
};
