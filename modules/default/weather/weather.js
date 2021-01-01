/* global WeatherProvider */

/* Magic Mirror
 * Module: Weather
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("weather", {
	// Default module config.
	defaults: {
		weatherProvider: "openweathermap",
		roundTemp: false,
		type: "current", // current, forecast, daily (equivalent to forecast), hourly (only with OpenWeatherMap /onecall endpoint)
		lat: 0,
		lon: 0,
		location: false,
		locationID: false,
		units: config.units,
		useKmh: false,
		tempUnits: config.units,
		windUnits: config.units,
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
		showSun: true,
		degreeLabel: false,
		decimalSymbol: ".",
		showIndoorTemperature: false,
		showIndoorHumidity: false,
		maxNumberOfDays: 5,
		maxEntries: 5,
		fade: true,
		fadePoint: 0.25, // Start on 1/4th of the list.
		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,
		apiKey: "",
		apiSecret: "",
		apiVersion: "2.5",
		apiBase: "https://api.openweathermap.org/data/", // TODO: this should not be part of the weather.js file, but should be contained in the openweatherprovider
		weatherEndpoint: "/weather",
		appendLocationNameToHeader: true,
		calendarClass: "calendar",
		tableClass: "small",
		onlyTemp: false,
		showPrecipitationAmount: false,
		colored: false,
		showFeelsLike: true,
		feelsLikeWithDegree: false
	},

	// Module properties.
	weatherProvider: null,

	// Define required scripts.
	getStyles: function () {
		return ["font-awesome.css", "weather-icons.css", "weather.css"];
	},

	// Return the scripts that are necessary for the weather module.
	getScripts: function () {
		return ["moment.js", "weatherprovider.js", "weatherobject.js", "suncalc.js", this.file("providers/" + this.config.weatherProvider.toLowerCase() + ".js")];
	},

	// Override getHeader method.
	getHeader: function () {
		if (this.config.appendLocationNameToHeader && this.weatherProvider) {
			if (this.data.header) return this.data.header + " " + this.weatherProvider.fetchedLocation();
			else return this.weatherProvider.fetchedLocation();
		}

		return this.data.header ? this.data.header : "";
	},

	// Start the weather module.
	start: function () {
		moment.locale(this.config.lang);

		// Initialize the weather provider.
		this.weatherProvider = WeatherProvider.initialize(this.config.weatherProvider, this);

		// Let the weather provider know we are starting.
		this.weatherProvider.start();

		this.config.feelsLikeWithDegree = this.translate("FEELS").indexOf("{DEGREE}") > -1;

		// Add custom filters
		this.addFilters();

		// Schedule the first update.
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override notification handler.
	notificationReceived: function (notification, payload, sender) {
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
		switch (this.config.type.toLowerCase()) {
			case "current":
				return `current.njk`;
			case "hourly":
				return `hourly.njk`;
			case "daily":
			case "forecast":
				return `forecast.njk`;
			default:
				return `${this.config.type.toLowerCase()}.njk`;
		}
	},

	// Add all the data to the template.
	getTemplateData: function () {
		return {
			config: this.config,
			current: this.weatherProvider.currentWeather(),
			forecast: this.weatherProvider.weatherForecast(),
			weatherData: this.weatherProvider.weatherData(),
			indoor: {
				humidity: this.indoorHumidity,
				temperature: this.indoorTemperature
			}
		};
	},

	// What to do when the weather provider has new information available?
	updateAvailable: function () {
		Log.log("New weather information available.");
		this.updateDom(0);
		this.scheduleUpdate();
	},

	scheduleUpdate: function (delay = null) {
		var nextLoad = this.config.updateInterval;
		if (delay !== null && delay >= 0) {
			nextLoad = delay;
		}

		setTimeout(() => {
			if (this.config.weatherEndpoint === "/onecall") {
				this.weatherProvider.fetchWeatherData();
			} else if (this.config.type === "forecast") {
				this.weatherProvider.fetchWeatherForecast();
			} else {
				this.weatherProvider.fetchCurrentWeather();
			}
		}, nextLoad);
	},

	roundValue: function (temperature) {
		var decimals = this.config.roundTemp ? 0 : 1;
		return parseFloat(temperature).toFixed(decimals);
	},

	addFilters() {
		this.nunjucksEnvironment().addFilter(
			"formatTime",
			function (date) {
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
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"unit",
			function (value, type) {
				if (type === "temperature") {
					if (this.config.tempUnits === "metric" || this.config.tempUnits === "imperial") {
						value += "°";
					}
					if (this.config.degreeLabel) {
						if (this.config.tempUnits === "metric") {
							value += "C";
						} else if (this.config.tempUnits === "imperial") {
							value += "F";
						} else {
							value += "K";
						}
					}
				} else if (type === "precip") {
					if (value === null || isNaN(value) || value === 0 || value.toFixed(2) === "0.00") {
						value = "";
					} else {
						if (this.config.weatherProvider === "ukmetoffice" || this.config.weatherProvider === "ukmetofficedatahub") {
							value += "%";
						} else {
							value = `${value.toFixed(2)} ${this.config.units === "imperial" ? "in" : "mm"}`;
						}
					}
				} else if (type === "humidity") {
					value += "%";
				}

				return value;
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"roundValue",
			function (value) {
				return this.roundValue(value);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"decimalSymbol",
			function (value) {
				return value.toString().replace(/\./g, this.config.decimalSymbol);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"calcNumSteps",
			function (forecast) {
				return Math.min(forecast.length, this.config.maxNumberOfDays);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"calcNumEntries",
			function (dataArray) {
				return Math.min(dataArray.length, this.config.maxEntries);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"opacity",
			function (currentStep, numSteps) {
				if (this.config.fade && this.config.fadePoint < 1) {
					if (this.config.fadePoint < 0) {
						this.config.fadePoint = 0;
					}
					var startingPoint = numSteps * this.config.fadePoint;
					var numFadesteps = numSteps - startingPoint;
					if (currentStep >= startingPoint) {
						return 1 - (currentStep - startingPoint) / numFadesteps;
					} else {
						return 1;
					}
				} else {
					return 1;
				}
			}.bind(this)
		);
	}
});
