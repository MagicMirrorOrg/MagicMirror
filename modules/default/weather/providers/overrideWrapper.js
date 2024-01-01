/* global Class, WeatherObject */

/*
 * Wrapper class to enable overrides of currentOverrideWeatherObject.
 *
 * Sits between the weather.js module and the provider implementations to allow us to
 * combine the incoming data from the CURRENT_WEATHER_OVERRIDE notification with the
 * existing data received from the current api provider. If no notifications have
 * been received then the api provider's data is used.
 *
 * The intent is to allow partial WeatherObjects from local sensors to augment or
 * replace the WeatherObjects from the api providers.
 *
 * This class shares the signature of WeatherProvider, and passes any methods not
 * concerning the current weather directly to the api provider implementation that
 * is currently in use.
 */
const OverrideWrapper = Class.extend({
	baseProvider: null,
	providerName: "localWrapper",
	notificationWeatherObject: null,
	currentOverrideWeatherObject: null,

	init (baseProvider) {
		this.baseProvider = baseProvider;

		// Binding the scope of current weather functions so any fetchData calls with
		// setCurrentWeather nested in them call this classes implementation instead
		// of the provider's default
		this.baseProvider.setCurrentWeather = this.setCurrentWeather.bind(this);
		this.baseProvider.currentWeather = this.currentWeather.bind(this);
	},

	/* Unchanged Api Provider Methods */

	setConfig (config) {
		this.baseProvider.setConfig(config);
	},
	start () {
		this.baseProvider.start();
	},
	fetchCurrentWeather () {
		this.baseProvider.fetchCurrentWeather();
	},
	fetchWeatherForecast () {
		this.baseProvider.fetchWeatherForecast();
	},
	fetchWeatherHourly () {
		this.baseProvider.fetchEatherHourly();
	},
	weatherForecast () {
		this.baseProvider.weatherForecast();
	},
	weatherHourly () {
		this.baseProvider.weatherHourly();
	},
	fetchedLocation () {
		this.baseProvider.fetchedLocation();
	},
	setWeatherForecast (weatherForecastArray) {
		this.baseProvider.setWeatherForecast(weatherForecastArray);
	},
	setWeatherHourly (weatherHourlyArray) {
		this.baseProvider.setWeatherHourly(weatherHourlyArray);
	},
	setFetchedLocation (name) {
		this.baseProvider.setFetchedLocation(name);
	},
	updateAvailable () {
		this.baseProvider.updateAvailable();
	},
	async fetchData (url, type = "json", requestHeaders = undefined, expectedResponseHeaders = undefined) {
		this.baseProvider.fetchData(url, type, requestHeaders, expectedResponseHeaders);
	},

	/* Override Methods */

	/**
	 * Override to return this scope's
	 * @returns {WeatherObject} The current weather object. May or may not contain overridden data.
	 */
	currentWeather () {
		return this.currentOverrideWeatherObject;
	},

	/**
	 * Override to combine the overrideWeatherObejct provided in the
	 * notificationReceived method with the currentOverrideWeatherObject provided by the
	 * api provider fetchData implementation.
	 * @param {WeatherObject} currentWeatherObject - the api provider weather object
	 */
	setCurrentWeather (currentWeatherObject) {
		this.currentOverrideWeatherObject = Object.assign(currentWeatherObject, this.notificationWeatherObject);
	},

	/**
	 * Updates the overrideWeatherObject, calls setCurrentWeather to combine it with
	 * the existing current weather object provided by the base provider, and signals
	 * that an update is ready.
	 * @param {WeatherObject} payload - the weather object received from the CURRENT_WEATHER_OVERRIDE
	 *                                  notification. Represents information to augment the
	 *                                  existing currentOverrideWeatherObject with.
	 */
	notificationReceived (payload) {
		this.notificationWeatherObject = payload;

		// setCurrentWeather combines the newly received notification weather with
		// the existing weather object we return for current weather
		this.setCurrentWeather(this.currentOverrideWeatherObject);
		this.updateAvailable();
	}
});
