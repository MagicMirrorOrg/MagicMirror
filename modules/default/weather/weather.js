/* global Module, WeatherProvider */

/* Magic Mirror
 * Module: Weather
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("weather",{
	// Default module config.
	defaults: {
		updateInterval: 10 * 60 * 1000,
		weatherProvider: "openweathermap",
		units: config.units,
		roundTemp: false,
		type: "current", //current, forecast

		location: false,
		locationID: false,
		appid: "",
		units: config.units,
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		showPeriod: true,
		showPeriodUpper: false,
		showWindDirection: true,
		showWindDirectionAsArrow: false,
		useBeaufort: true,
		lang: config.language,
		showHumidity: false,
		degreeLabel: false,
		showIndoorTemperature: false,
		showIndoorHumidity: false,

		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,

		apiVersion: "2.5",
		apiBase: "http://api.openweathermap.org/data/",
		weatherEndpoint: "weather",

		appendLocationNameToHeader: true,
		calendarClass: "calendar",

		onlyTemp: false,
		roundTemp: false
	},

	// Module properties.
	weatherProvider: null,

	// Define required scripts.
	getStyles: function() {
		return ["font-awesome.css", "weather-icons.css", "weather.css"];
	},

	// Return the scripts that are nessecery for the weather module.
	getScripts: function () {
		var scripts = [
			"moment.js",
			"weatherprovider.js",
			"weatherobject.js"
		];

		// Add the provider file to the required scripts.
		scripts.push(this.file("providers/" + this.config.weatherProvider.toLowerCase() + ".js"));

		return scripts
	},

	// Start the weather module.
	start: function () {
		// Initialize the weather provider.
		this.weatherProvider = WeatherProvider.initialize(this.config.weatherProvider, this);

		// Let the weather provider know we are starting.
		this.weatherProvider.start();

		// Add custom filters
		this.addFilters();

		// Schedule the first update.
		this.scheduleUpdate(0);
	},

	// Select the template depending on the display type.
	getTemplate: function () {
		return this.config.type.toLowerCase() + ".njk"
	},

	// Add all the data to the template.
	getTemplateData: function () {
		return {
			config: this.config,
			current: this.weatherProvider.currentWeather(),
			forecast: this.weatherProvider.weatherForecast()
		}
	},

	// What to do when the weather provider has new information available?
	updateAvailable: function() {
		Log.log("New weather information available.");
		this.updateDom(0);
		this.scheduleUpdate(5000);
	},

	scheduleUpdate: function(delay = null) {
		var nextLoad = this.config.updateInterval;
		if (delay !== null && delay >= 0) {
			nextLoad = delay;
		}

		setTimeout(() => {
			switch (this.config.type) {
			case "forecast":
				this.weatherProvider.fetchWeatherForecast();
				break;
			default:
			case "current":
				this.weatherProvider.fetchCurrentWeather();
				break;
			}
		}, nextLoad);
	},

	addFilters() {
		this.nunjucksEnvironment().addFilter("formatTime", function(date) {
			date = moment(date);

			if (this.config.timeFormat !== 24) {
				if (this.config.showPeriod) {
					if (this.config.showPeriodUpper) {
						return date.format("h:mm A");
					} else {
						return date.format("h:mm a");
					}
				} else {
					return date.format("h:mm");
				}
			}

			return date.format("HH:mm");
		}.bind(this));

		this.nunjucksEnvironment().addFilter("unit", function (value, type) {
			if (type === "temperature") {
				value += "°";
				if (this.config.scale || this.config.degreeLabel) {
					if (this.config.units === "metric") {
						value += "C";
					} else if (this.config.units === "imperial") {
						value += "F";
					} else {
						value += "K";
					}
				}
			}

			return value;
		}.bind(this));
	}
});
