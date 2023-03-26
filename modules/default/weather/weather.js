/* global WeatherProvider, WeatherUtils */

/* MagicMirror²
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
		lang: config.language,
		units: config.units,
		tempUnits: config.units,
		windUnits: config.units,
		timeFormat: config.timeFormat,
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,
		showFeelsLike: true,
		showHumidity: false,
		showIndoorHumidity: false,
		showIndoorTemperature: false,
		showPeriod: true,
		showPeriodUpper: false,
		showPrecipitationAmount: false,
		showPrecipitationProbability: false,
		showSun: true,
		showWindDirection: true,
		showWindDirectionAsArrow: false,
		degreeLabel: false,
		decimalSymbol: ".",
		maxNumberOfDays: 5,
		maxEntries: 5,
		ignoreToday: false,
		fade: true,
		fadePoint: 0.25, // Start on 1/4th of the list.
		initialLoadDelay: 0, // 0 seconds delay
		appendLocationNameToHeader: true,
		calendarClass: "calendar",
		tableClass: "small",
		onlyTemp: false,
		colored: false,
		absoluteDates: false,
		hourlyForecastIncrements: 1
	},

	// Module properties.
	weatherProvider: null,

	// Can be used by the provider to display location of event if nothing else is specified
	firstEvent: null,

	// Define required scripts.
	getStyles: function () {
		return ["font-awesome.css", "weather-icons.css", "weather.css"];
	},

	// Return the scripts that are necessary for the weather module.
	getScripts: function () {
		return ["moment.js", this.file("../utils.js"), "weatherutils.js", "weatherprovider.js", "weatherobject.js", "suncalc.js", this.file(`providers/${this.config.weatherProvider.toLowerCase()}.js`)];
	},

	// Override getHeader method.
	getHeader: function () {
		if (this.config.appendLocationNameToHeader && this.weatherProvider) {
			if (this.data.header) return `${this.data.header} ${this.weatherProvider.fetchedLocation()}`;
			else return this.weatherProvider.fetchedLocation();
		}

		return this.data.header ? this.data.header : "";
	},

	// Start the weather module.
	start: function () {
		moment.locale(this.config.lang);

		if (this.config.useKmh) {
			Log.warn("Your are using the deprecated config values 'useKmh'. Please switch to windUnits!");
			this.windUnits = "kmh";
		} else if (this.config.useBeaufort) {
			Log.warn("Your are using the deprecated config values 'useBeaufort'. Please switch to windUnits!");
			this.windUnits = "beaufort";
		}

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
	notificationReceived: function (notification, payload, sender) {
		if (notification === "CALENDAR_EVENTS") {
			const senderClasses = sender.data.classes.toLowerCase().split(" ");
			if (senderClasses.indexOf(this.config.calendarClass.toLowerCase()) !== -1) {
				this.firstEvent = null;
				for (let event of payload) {
					if (event.location || event.geo) {
						this.firstEvent = event;
						Log.debug("First upcoming event with location: ", event);
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
				return "current.njk";
			case "hourly":
				return "hourly.njk";
			case "daily":
			case "forecast":
				return "forecast.njk";
			//Make the invalid values use the "Loading..." from forecast
			default:
				return "forecast.njk";
		}
	},

	// Add all the data to the template.
	getTemplateData: function () {
		const currentData = this.weatherProvider.currentWeather();
		const forecastData = this.weatherProvider.weatherForecast();

		// Skip some hourly forecast entries if configured
		const hourlyData = this.weatherProvider.weatherHourly()?.filter((e, i) => (i + 1) % this.config.hourlyForecastIncrements === this.config.hourlyForecastIncrements - 1);

		return {
			config: this.config,
			current: currentData,
			forecast: forecastData,
			hourly: hourlyData,
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

		if (this.weatherProvider.currentWeather()) {
			this.sendNotification("CURRENTWEATHER_TYPE", { type: this.weatherProvider.currentWeather().weatherType.replace("-", "_") });
		}

		const notificationPayload = {
			currentWeather: this.weatherProvider?.currentWeatherObject?.simpleClone() ?? null,
			forecastArray: this.weatherProvider?.weatherForecastArray?.map((ar) => ar.simpleClone()) ?? [],
			hourlyArray: this.weatherProvider?.weatherHourlyArray?.map((ar) => ar.simpleClone()) ?? [],
			locationName: this.weatherProvider?.fetchedLocationName,
			providerName: this.weatherProvider.providerName
		};
		this.sendNotification("WEATHER_UPDATED", notificationPayload);
	},

	scheduleUpdate: function (delay = null) {
		let nextLoad = this.config.updateInterval;
		if (delay !== null && delay >= 0) {
			nextLoad = delay;
		}

		setTimeout(() => {
			switch (this.config.type.toLowerCase()) {
				case "current":
					this.weatherProvider.fetchCurrentWeather();
					break;
				case "hourly":
					this.weatherProvider.fetchWeatherHourly();
					break;
				case "daily":
				case "forecast":
					this.weatherProvider.fetchWeatherForecast();
					break;
				default:
					Log.error(`Invalid type ${this.config.type} configured (must be one of 'current', 'hourly', 'daily' or 'forecast')`);
			}
		}, nextLoad);
	},

	roundValue: function (temperature) {
		const decimals = this.config.roundTemp ? 0 : 1;
		const roundValue = parseFloat(temperature).toFixed(decimals);
		return roundValue === "-0" ? 0 : roundValue;
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
			function (value, type, valueUnit) {
				if (type === "temperature") {
					value = `${this.roundValue(WeatherUtils.convertTemp(value, this.config.tempUnits))}°`;
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
						value = WeatherUtils.convertPrecipitationUnit(value, valueUnit, this.config.units);
					}
				} else if (type === "humidity") {
					value += "%";
				} else if (type === "wind") {
					value = WeatherUtils.convertWind(value, this.config.windUnits);
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
					const startingPoint = numSteps * this.config.fadePoint;
					const numFadesteps = numSteps - startingPoint;
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
