/* Wrapper to enable the injection of local sensor data */
const LocalWrapper = Class.extend({
	baseProvider: null,
	providerName: "localWrapper",
	overrideWeatherObject: null,
	currentWeatherObject: null,

	init(baseProvider) {
		this.baseProvider = baseProvider;

		// baseProvider does not inherit LocalWrapper - need to be explicit to replace
		// methods inherited from Weatherprovider
		this.baseProvider.setCurrentWeather = this.setCurrentWeather.bind(this);
		this.baseProvider.currentWeather = this.currentWeather.bind(this);
	},

	setConfig(config) {
		this.baseProvider.setConfig(config);
	},
	start() {
		this.baseProvider.start();
	},
	fetchCurrentWeather() {
		this.baseProvider.fetchCurrentWeather();
	},
	fetchWeatherForecast() {
		this.baseProvider.fetchWeatherForecast();
	},
	fetchWeatherHourly() {
		this.baseProvider.fetchEatherHourly();
	},

	weatherForecast() {
		this.baseProvider.weatherForecast();
	},
	weatherHourly() {
		this.baseProvider.weatherHourly();
	},
	fetchedLocation() {
		this.baseProvider.fetchedLocation();
	},
	setWeatherForecast(weatherForecastArray) {
		this.baseProvider.setWeatherForecast(weatherForecastArray);
	},
	setWeatherHourly(weatherHourlyArray) {
		this.baseProvider.setWeatherHourly(weatherHourlyArray);
	},
	setFetchedLocation(name) {
		this.baseProvider.setFetchedLocation(name);
	},
	updateAvailable() {
		this.baseProvider.updateAvailable();
	},
	async fetchData(url, type = "json", requestHeaders = undefined, expectedResponseHeaders = undefined) {
		this.baseProvider.fetchData(url, type, requestHeaders, expectedResponseHeaders);
	},

	// "Override" to fetch the currentWeatherObject from this class, not the provider
	currentWeather() {
		return this.currentWeatherObject;
	},

	// "Override" to set the currentWeatherObject ot this class, not the provider
	setCurrentWeather(currentWeatherObject) {
		// Merge in any sensor data we got
		this.currentWeatherObject = Object.assign(currentWeatherObject, this.overrideWeatherObject);
	},

	notificationReceived(payload) {
		this.overrideWeatherObject = payload;
		this.setCurrentWeather(this.currentWeatherObject);
		this.updateAvailable();
	}
});
