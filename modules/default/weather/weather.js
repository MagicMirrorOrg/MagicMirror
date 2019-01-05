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
		weatherEndpoint: "/weather",

		appendLocationNameToHeader: true,
		calendarClass: "calendar",
		tableClass: "small",

		onlyTemp: false,
		showRainAmount: true,
		colored: false,
		showFeelsLike: true
	},

	// Module properties.
	weatherProvider: null,

	// Define required scripts.
	getStyles: function() {
		return ["font-awesome.css", "weather-icons.css", "weather.css"];
	},

	// Return the scripts that are nessecery for the weather module.
	getScripts: function () {
		return [
			"moment.js",
			"weatherprovider.js",
			"weatherobject.js",
			this.file("providers/" + this.config.weatherProvider.toLowerCase() + ".js")
		];
	},

	// Override getHeader method.
	getHeader: function() {
		if (this.config.appendLocationNameToHeader && this.weatherProvider) {
			return this.data.header + " " + this.weatherProvider.fetchedLocation();
		}

		return this.data.header;
	},

	// Start the weather module.
	start: function () {
		moment.locale(this.config.lang);
		// Initialize the weather provider.
		this.weatherProvider = WeatherProvider.initialize(this.config.weatherProvider, this);

		// Let the weather provider know we are starting.
		this.weatherProvider.start();

		// Add custom filters
		this.addFilters();

		// Schedule the first update.
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		if (notification === "CALENDAR_EVENTS") {
			var senderClasses = sender.data.classes.toLowerCase().split(" ");
			if (senderClasses.indexOf(this.config.calendarClass.toLowerCase()) !== -1) {
				this.firstEvent = false;

				for (var e in payload) {
					var event = payload[e];
					if (event.location || event.geo) {
						this.firstEvent = event;
						//Log.log("First upcoming event with location: ", event);
						break;
					}
				}
			}
		} else if (notification === "INDOOR_TEMPERATURE") {
			this.indoorTemperature = this.roundValue(payload);
			this.updateDom(300);
		} else if (notification === "INDOOR_HUMIDITY") {
			this.indoorHumidity = this.roundValue(payload);
			this.updateDom(300);
		}
	},

	// Select the template depending on the display type.
	getTemplate: function () {
		return `${this.config.type.toLowerCase()}.njk`;
	},

	// Add all the data to the template.
	getTemplateData: function () {
		return {
			config: this.config,
			current: this.weatherProvider.currentWeather(),
			forecast: this.weatherProvider.weatherForecast(),
			indoor: {
				humidity: this.indoorHumidity,
				temperature: this.indoorTemperature
			}
		}
	},

	// What to do when the weather provider has new information available?
	updateAvailable: function() {
		Log.log("New weather information available.");
		this.updateDom(0);
		this.scheduleUpdate();
	},

	scheduleUpdate: function(delay = null) {
		var nextLoad = this.config.updateInterval;
		if (delay !== null && delay >= 0) {
			nextLoad = delay;
		}

		setTimeout(() => {
			if (this.config.type === "forecast") {
				this.weatherProvider.fetchWeatherForecast();
			} else {
				this.weatherProvider.fetchCurrentWeather();
			}
		}, nextLoad);
	},

	roundValue: function(temperature) {
		var decimals = this.config.roundTemp ? 0 : 1;
		return parseFloat(temperature).toFixed(decimals);
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
				if (this.config.degreeLabel) {
					if (this.config.units === "metric") {
						value += "C";
					} else if (this.config.units === "imperial") {
						value += "F";
					} else {
						value += "K";
					}
				}
			} else if (type === "rain") {
				if (isNaN(value)) {
					value = "";
				} else {
					value = `${value.toFixed(2)} ${this.config.units === "imperial" ? "in" : "mm"}`;
				}
			}

			return value;
		}.bind(this));

		this.nunjucksEnvironment().addFilter("roundValue", function(value) {
			return this.roundValue(value);
		}.bind(this));
	}
});
