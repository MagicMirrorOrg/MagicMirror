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

	getCorsUrl: function () {
		if (this.config.mockData || typeof this.config.useCorsProxy === "undefined" || !this.config.useCorsProxy) {
			return "";
		} else {
			return location.protocol + "//" + location.host + "/cors?url=";
		}
	},

	// A convenience function to make requests. It returns a promise.
	fetchData: function (url, method = "GET", type = "json") {
		url = this.getCorsUrl() + url;
		const getData = function (mockData) {
			return new Promise(function (resolve, reject) {
				if (mockData) {
					let data = mockData;
					data = data.substring(1, data.length - 1);
					resolve(JSON.parse(data));
				} else {
					const request = new XMLHttpRequest();
					request.open(method, url, true);
					request.onreadystatechange = function () {
						if (this.readyState === 4) {
							if (this.status === 200) {
								if (type === "xml") {
									resolve(this.responseXML);
								} else {
									resolve(JSON.parse(this.response));
								}
							} else {
								reject(request);
							}
						}
					};
					request.send();
				}
			});
		};

		return getData(this.config.mockData);
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
