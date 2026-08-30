/* global WeatherUtils, WeatherObject, formatTime */

Module.register("weather", {
	// Default module config.
	defaults: {
		weatherProvider: "openweathermap",
		roundTemp: false,
		type: "current", // current, forecast, daily (equivalent to forecast), hourly
		lang: config.language,
		units: config.units,
		tempUnits: config.units,
		windUnits: config.units,
		timeFormat: config.timeFormat,
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,
		showFeelsLike: true,
		showHumidity: "none", // possible options for "current" weather are "none", "wind", "temp", "feelslike" or "below", for "hourly" weather "none" or "true"
		hideZeroes: false, // hide zeroes (and empty columns) in hourly, currently only for precipitation
		showIndoorHumidity: false,
		showIndoorTemperature: false,
		allowOverrideNotification: false,
		showPeriod: true,
		showPeriodUpper: false,
		showPrecipitationAmount: false,
		showPrecipitationProbability: false,
		showUVIndex: false,
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
		forecastDateFormat: "ddd", // format for forecast date display, e.g., "ddd" = Mon, "dddd" = Monday, "D MMM" = 18 Oct
		hourlyForecastIncrements: 1,
		themeDir: "",
		themeCustomScripts: []
	},

	// Module properties (all providers run server-side)
	instanceId: null,
	fetchedLocationName: null,
	currentWeatherObject: null,
	weatherForecastArray: null,
	weatherHourlyArray: null,

	// Can be used by the provider to display location of event if nothing else is specified
	firstEvent: null,

	getThemeDir () {
		const td = this.config.themeDir.replace(/\/+$/, "");
		if (td.length > 0) {
			return `${td}/`;
		} else {
			return "";
		}
	},

	// Define required scripts.
	getStyles () {
		return ["font-awesome.css", "weather-icons.css", `${this.getThemeDir()}weather.css`];
	},

	// Return the scripts that are necessary for the weather module.
	getScripts () {
		// Only load client-side dependencies for rendering
		// All providers run server-side via node_helper
		const resArr = ["moment.js", "weatherutils.js", "weatherobject.js", "suncalc.js"];
		this.config.themeCustomScripts.forEach((element) => {
			resArr.push(`${this.getThemeDir()}${element}`);
		});
		return resArr;
	},

	// Override getHeader method.
	getHeader () {
		if (this.config.appendLocationNameToHeader) {
			const locationName = this.fetchedLocationName || "";

			if (this.data.header && locationName) return `${this.data.header} ${locationName}`;
			else if (locationName) return locationName;
		}

		return this.data.header ? this.data.header : "";
	},

	// Start the weather module.
	start () {
		moment.locale(this.config.lang);

		if (this.config.useKmh) {
			Log.warn("[weather] Deprecation warning: Your are using the deprecated config values 'useKmh'. Please switch to windUnits!");
			this.windUnits = "kmh";
		} else if (this.config.useBeaufort) {
			Log.warn("[weather] Deprecation warning: Your are using the deprecated config values 'useBeaufort'. Please switch to windUnits!");
			this.windUnits = "beaufort";
		}
		if (typeof this.config.showHumidity === "boolean") {
			Log.warn("[weather] Deprecation warning: Please consider updating showHumidity to the new style (config string).");
			this.config.showHumidity = this.config.showHumidity ? "wind" : "none";
		}

		// All providers run server-side: use stable identifier so reconnects don't spawn duplicate HTTPFetchers
		this.instanceId = this.identifier;

		if (window.initWeatherTheme) window.initWeatherTheme(this);

		Log.log(`[weather] Initializing server-side provider with instance ID: ${this.instanceId}`);

		this.sendSocketNotification("INIT_WEATHER", {
			instanceId: this.instanceId,
			weatherProvider: this.config.weatherProvider,
			...this.config
		});

		// Server-driven fetching - no client-side scheduling needed

		// Add custom filters
		this.addFilters();
	},

	// Cleanup on module hide/suspend
	stop () {
		if (this.instanceId) {
			this.sendSocketNotification("STOP_WEATHER", {
				instanceId: this.instanceId
			});
		}
	},

	// Override notification handler.
	notificationReceived (notification, payload, sender) {
		if (notification === "CALENDAR_EVENTS") {
			const senderClasses = sender.data.classes.toLowerCase().split(" ");
			if (senderClasses.indexOf(this.config.calendarClass.toLowerCase()) !== -1) {
				this.firstEvent = null;
				for (let event of payload) {
					if (event.location || event.geo) {
						this.firstEvent = event;
						Log.debug("[weather] First upcoming event with location: ", event);
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
		} else if (notification === "CURRENT_WEATHER_OVERRIDE" && this.config.allowOverrideNotification) {
			// Override current weather with data from local sensors
			if (this.currentWeatherObject) {
				Object.assign(this.currentWeatherObject, payload);
				this.updateDom(this.config.animationSpeed);
			}
		}
	},

	// Handle socket notifications from node_helper
	socketNotificationReceived (notification, payload) {
		if (payload.instanceId !== this.instanceId) {
			return;
		}

		if (notification === "WEATHER_INITIALIZED") {
			Log.log(`[weather] Provider initialized, location: ${payload.locationName}`);
			this.fetchedLocationName = payload.locationName;
			this.updateDom();
			// Server-driven fetching - HTTPFetcher will send WEATHER_DATA automatically
		} else if (notification === "WEATHER_DATA") {
			this.handleWeatherData(payload);
		} else if (notification === "WEATHER_ERROR") {
			Log.error("[weather] Error from node_helper:", payload.error);
		}
	},

	handleWeatherData (payload) {
		const { type, data } = payload;

		if (!data) {
			return;
		}

		// Convert plain objects to WeatherObject instances
		switch (type) {
			case "current":
				this.currentWeatherObject = this.createWeatherObject(data);
				break;
			case "forecast":
			case "daily":
				this.weatherForecastArray = data.map((d) => this.createWeatherObject(d));
				break;
			case "hourly":
				this.weatherHourlyArray = data.map((d) => this.createWeatherObject(d));
				break;
			default:
				Log.warn(`Unknown weather data type: ${type}`);
				break;
		}

		this.updateAvailable();
	},

	createWeatherObject (data) {
		const weather = new WeatherObject();
		Object.assign(weather, {
			...data,
			// Convert to moment objects for template compatibility
			date: data.date ? moment(data.date) : null,
			sunrise: data.sunrise ? moment(data.sunrise) : null,
			sunset: data.sunset ? moment(data.sunset) : null
		});
		return weather;
	},

	// Select the template depending on the display type.
	getTemplate () {
		switch (this.config.type.toLowerCase()) {
			case "current":
				return `${this.getThemeDir()}current.njk`;
			case "hourly":
				return `${this.getThemeDir()}hourly.njk`;
			case "daily":
			case "forecast":
				return `${this.getThemeDir()}forecast.njk`;
			//Make the invalid values use the "Loading..." from forecast
			default:
				return `${this.getThemeDir()}forecast.njk`;
		}
	},

	// Add all the data to the template.
	getTemplateData () {
		const now = new Date();
		// Filter out past entries, but keep the current hour (e.g. show 0:00 at 0:10).
		// This ensures consistent behavior across all providers, regardless of whether
		// a provider filters past entries itself.
		const startOfHour = new Date(now);
		startOfHour.setMinutes(0, 0, 0);
		const upcomingHourlyData = this.weatherHourlyArray
			?.filter((entry) => entry.date?.valueOf() >= startOfHour.getTime());
		const hourlySourceData = upcomingHourlyData?.length ? upcomingHourlyData : this.weatherHourlyArray;

		const increment = this.config.hourlyForecastIncrements;
		const keepByConfiguredIncrement = (_entry, index) => {
			// Keep the existing offset behavior of hourlyForecastIncrements.
			return (index + 1) % increment === increment - 1;
		};

		const hourlyData = hourlySourceData?.filter(keepByConfiguredIncrement);

		return {
			config: this.config,
			current: this.currentWeatherObject,
			forecast: this.weatherForecastArray,
			hourly: hourlyData,
			indoor: {
				humidity: this.indoorHumidity,
				temperature: this.indoorTemperature
			}
		};
	},

	// What to do when the weather provider has new information available?
	updateAvailable () {
		Log.log("[weather] New weather information available.");
		if (window.updateWeatherTheme) {
			window.updateWeatherTheme(this);
		} else {
			this.updateDom(300);
		}

		const currentWeather = this.currentWeatherObject;

		if (currentWeather) {
			this.sendNotification("CURRENTWEATHER_TYPE", { type: currentWeather.weatherType?.replace("-", "_") });
		}

		const notificationPayload = {
			currentWeather: this.config.units === "imperial"
				? WeatherUtils.convertWeatherObjectToImperial(currentWeather?.simpleClone()) ?? null
				: currentWeather?.simpleClone() ?? null,
			forecastArray: this.config.units === "imperial"
				? this.getForecastArray()?.map((ar) => WeatherUtils.convertWeatherObjectToImperial(ar.simpleClone())) ?? []
				: this.getForecastArray()?.map((ar) => ar.simpleClone()) ?? [],
			hourlyArray: this.config.units === "imperial"
				? this.getHourlyArray()?.map((ar) => WeatherUtils.convertWeatherObjectToImperial(ar.simpleClone())) ?? []
				: this.getHourlyArray()?.map((ar) => ar.simpleClone()) ?? [],
			locationName: this.fetchedLocationName,
			providerName: this.config.weatherProvider
		};

		this.sendNotification("WEATHER_UPDATED", notificationPayload);
	},

	getForecastArray () {
		return this.weatherForecastArray;
	},

	getHourlyArray () {
		return this.weatherHourlyArray;
	},

	// scheduleUpdate removed - all providers use server-driven fetching via HTTPFetcher

	roundValue (temperature) {
		if (temperature === null || temperature === undefined) {
			return "";
		}
		const decimals = this.config.roundTemp ? 0 : 1;
		const roundValue = parseFloat(temperature).toFixed(decimals);
		if (roundValue === "NaN") {
			return "";
		}
		return roundValue === "-0" ? 0 : roundValue;
	},

	addFilters () {
		this.nunjucksEnvironment().addFilter(
			"formatTime",
			function (date) {
				return formatTime(this.config, date);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"unit",
			function (value, type, valueUnit) {
				let formattedValue;
				if (type === "temperature") {
					if (value === null || value === undefined) {
						formattedValue = "";
					} else {
						formattedValue = `${this.roundValue(WeatherUtils.convertTemp(value, this.config.tempUnits))}°`;
						if (this.config.degreeLabel) {
							if (this.config.tempUnits === "metric") {
								formattedValue += "C";
							} else if (this.config.tempUnits === "imperial") {
								formattedValue += "F";
							} else {
								formattedValue += "K";
							}
						}
					}
				} else if (type === "precip") {
					if (value === null || isNaN(value)) {
						formattedValue = "";
					} else {
						formattedValue = WeatherUtils.convertPrecipitationUnit(value, valueUnit, this.config.units);
					}
				} else if (type === "humidity") {
					formattedValue = `${value}%`;
				} else if (type === "wind") {
					formattedValue = WeatherUtils.convertWind(value, this.config.windUnits);
				}
				return formattedValue;
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
