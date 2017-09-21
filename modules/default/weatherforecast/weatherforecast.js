/* global Module */

/* Magic Mirror
 * Module: WeatherForecast
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("weatherforecast", {

	// Default module config.
	defaults: {
		location: false,
		locationID: false,
		appid: "",
		units: config.units,
		maxNumberOfDays: 7,
		showRainAmount: false,
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		lang: config.language,
		fade: true,
		fadePoint: 0.25, // Start on 1/4th of the list.
		colored: false,
		scale: false,

		initialLoadDelay: 2500, // 2.5 seconds delay. This delay is used to keep the OpenWeather API happy.
		retryDelay: 2500,

		apiVersion: "2.5",
		apiXuVersion: "v1",
		apiBase: "http://api.openweathermap.org/data/",
		apiXuBase: "https://api.apixu.com/",
		forecastEndpoint: "forecast/daily",
		apiXuforecastEndpoint: "forecast.json",

		appendLocationNameToHeader: true,
		calendarClass: "calendar",

		roundTemp: false,
		scale: false,

		iconTable: {
			"01d": "wi-day-sunny",
			"02d": "wi-day-cloudy",
			"03d": "wi-cloudy",
			"04d": "wi-cloudy-windy",
			"09d": "wi-showers",
			"10d": "wi-rain",
			"11d": "wi-thunderstorm",
			"13d": "wi-snow",
			"50d": "wi-fog",
			"01n": "wi-night-clear",
			"02n": "wi-night-cloudy",
			"03n": "wi-night-cloudy",
			"04n": "wi-night-cloudy",
			"09n": "wi-night-showers",
			"10n": "wi-night-rain",
			"11n": "wi-night-thunderstorm",
			"13n": "wi-night-snow",
			"50n": "wi-night-alt-cloudy-windy"
		},
		iconApiXuTable: {
			"1000-day": "wi-day-sunny",
			"1003-day": "wi-day-cloudy",
			"1006-day": "wi-cloud",
			"1009-day": "wi-cloudy",
			"1030-day": "wi-day-fog",
			"1063-day": "wi-day-showers",
			"1066-day": "wi-day-snow",
			"1069-day": "wi-day-sleet",
			"1072-day": "wi-day-rain-mix",
			"1087-day": "wi-day-thunderstorm",
			"1114-day": "wi-snow",
			"1117-day": "wi-snow-wind",
			"1135-day": "wi-day-fog",
			"1147-day": "wi-day-fog",
			"1153-day": "wi-day-showers",
			"1168-day": "wi-day-rain-mix",
			"1171-day": "wi-rain-mix",
			"1183-day": "wi-day-rain",
			"1186-day": "wi-day-rain",
			"1189-day": "wi-day-rain",
			"1192-day": "wi-rain",
			"1195-day": "wi-rain",
			"1198-day": "wi-day-rain-mix",
			"1201-day": "wi-rain-mix",
			"1204-day": "wi-day-sleet",
			"1207-day": "wi-sleet",
			"1210-day": "wi-day-snow",
			"1213-day": "wi-day-snow",
			"1216-day": "wi-day-snow",
			"1219-day": "wi-snow",
			"1222-day": "wi-day-snow",
			"1225-day": "wi-day-snow",
			"1237-day": "wi-hail",
			"1240-day": "wi-day-rain",
			"1243-day": "wi-rain",
			"1246-day": "wi-rain",
			"1249-day": "wi-day-sleet",
			"1252-day": "wi-day-sleet",
			"1255-day": "wi-day-snow",
			"1258-day": "wi-snow",
			"1261-day": "wi-day-hail",
			"1264-day": "wi-hail",
			"1273-day": "wi-day-lightning",
			"1276-day": "wi-thunderstorm",
			"1279-day": "wi-day-snow-thunderstorm",
			"1282-day": "wi-day-snow-thunderstorm",
			"1000-night": "wi-night-clear",
			"1003-night": "wi-night-alt-cloudy",
			"1006-night": "wi-cloud",
			"1009-night": "wi-cloudy",
			"1030-night": "wi-night-fog",
			"1063-night": "wi-night-showers",
			"1066-night": "wi-night-snow",
			"1069-night": "wi-night-sleet",
			"1072-night": "wi-night-rain-mix",
			"1087-night": "wi-night-storm-showers",
			"1114-night": "wi-snow",
			"1117-night": "wi-snow-wind",
			"1135-night": "wi-night-fog",
			"1147-night": "wi-night-fog",
			"1153-night": "wi-night-showers",
			"1168-night": "wi-night-rain-mix",
			"1171-night": "wi-rain-mix",
			"1183-night": "wi-night-rain",
			"1186-night": "wi-night-rain",
			"1189-night": "wi-night-rain",
			"1192-night": "wi-rain",
			"1195-night": "wi-rain",
			"1198-night": "wi-night-rain-mix",
			"1201-night": "wi-rain-mix",
			"1204-night": "wi-night-sleet",
			"1207-night": "wi-sleet",
			"1210-night": "wi-night-snow",
			"1213-night": "wi-night-snow",
			"1216-night": "wi-night-snow",
			"1219-night": "wi-snow",
			"1222-night": "wi-night-snow",
			"1225-night": "wi-night-snow",
			"1237-night": "wi-hail",
			"1240-night": "wi-night-rain",
			"1243-night": "wi-rain",
			"1246-night": "wi-rain",
			"1249-night": "wi-night-sleet",
			"1252-night": "wi-night-sleet",
			"1255-night": "wi-night-snow",
			"1258-night": "wi-snow",
			"1261-night": "wi-night-hail",
			"1264-night": "wi-hail",
			"1273-night": "wi-night-lightning",
			"1276-night": "wi-thunderstorm",
			"1279-night": "wi-night-snow-thunderstorm",
			"1282-night": "wi-night-snow-thunderstorm",
		},
	},


	// create a variable for the first upcoming calendaar event. Used if no location is specified.
	firstEvent: false,

	// create a variable to hold the location name based on the API result.
	fetchedLocationName: "",

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define required scripts.
	getStyles: function() {
		return ["weather-icons.css", "weatherforecast.css"];
	},

	// Define required translations.
	getTranslations: function() {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build yiur own module including translations, check out the documentation.
		return false;
	},

	//which API to use
	isOpenWeatherAPI: function() {
		return this.config.appid ? true : false;
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.forecast = [];
		this.loaded = false;
		if (!this.isOpenWeatherAPI()) {
			this.config.apiBase = this.config.apiXuBase;
			this.config.apiVersion = this.config.apiXuVersion;
			this.config.forecastEndpoint = this.config.apiXuforecastEndpoint;
		}

		this.scheduleUpdate(this.config.initialLoadDelay);

		this.updateTimer = null;

	},


	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.appid === "" && this.config.apiXuKey === "") {
			wrapper.innerHTML = "Please set the correct openweather <i>appid</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var table = document.createElement("table");
		table.className = "small";

		for (var f in this.forecast) {
			var forecast = this.forecast[f];

			var row = document.createElement("tr");
			if (this.config.colored) {
				row.className = "colored";
			}
			table.appendChild(row);

			var dayCell = document.createElement("td");
			dayCell.className = "day";
			dayCell.innerHTML = forecast.day;
			row.appendChild(dayCell);

			var iconCell = document.createElement("td");
			iconCell.className = "bright weather-icon";
			row.appendChild(iconCell);

			var icon = document.createElement("span");
			icon.className = "wi weathericon " + forecast.icon;
			iconCell.appendChild(icon);

			var degreeLabel = "";
			if (this.config.scale) {
				switch (this.config.units) {
				case "metric":
					degreeLabel = " &deg;C";
					break;
				case "imperial":
					degreeLabel = " &deg;F";
					break;
				case "default":
					degreeLabel = " &deg;C";
					break;
				}
			}
			var maxTempCell = document.createElement("td");
			maxTempCell.innerHTML = forecast.maxTemp + degreeLabel;
			maxTempCell.className = "align-right bright max-temp";
			row.appendChild(maxTempCell);

			var minTempCell = document.createElement("td");
			minTempCell.innerHTML = forecast.minTemp + degreeLabel;
			minTempCell.className = "align-right min-temp";
			row.appendChild(minTempCell);

			if (this.config.showRainAmount) {
				var rainCell = document.createElement("td");
				if (isNaN(forecast.rain)) {
					rainCell.innerHTML = "";
				} else {
					if (config.units !== "imperial") {
						rainCell.innerHTML = forecast.rain + " mm";
					} else {
						rainCell.innerHTML = forecast.rain + " in";
					}
				}
				rainCell.className = "align-right bright rain";
				row.appendChild(rainCell);
			}

			if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
					this.config.fadePoint = 0;
				}
				var startingPoint = this.forecast.length * this.config.fadePoint;
				var steps = this.forecast.length - startingPoint;
				if (f >= startingPoint) {
					var currentStep = f - startingPoint;
					row.style.opacity = 1 - (1 / steps * currentStep);
				}
			}
		}

		return table;
	},

	// Override getHeader method.
	getHeader: function() {
		if (this.config.appendLocationNameToHeader) {
			return this.data.header + " " + this.fetchedLocationName;
		}

		return this.data.header;
	},

	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		if (notification === "DOM_OBJECTS_CREATED") {
			if (this.config.appendLocationNameToHeader) {
				this.hide(0, { lockString: this.identifier });
			}
		}
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
		}
	},


	/* updateWeather(compliments)
	 * Requests new data from openweather.org.
	 * Calls processWeather on succesfull response.
	 */
	updateWeather: function() {
		if (this.config.appid === "" && this.config.apiXuKey === "") {
			Log.error("WeatherForecast: APPID or APIXUKEY not set!");
			return;
		}
		var url = this.config.apiBase + this.config.apiVersion + "/" + this.config.forecastEndpoint + this.getParams();
		var self = this;
		var retry = true;

		var weatherRequest = new XMLHttpRequest();
		weatherRequest.open("GET", url, true);
		weatherRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processWeather(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);

					Log.error(self.name + ": Incorrect APPID.");
					retry = true;
				} else {
					Log.error(self.name + ": Could not load weather.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		weatherRequest.send();
	},

	/* getParams(compliments)
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams: function() {
		var params = "?";
		if (!this.isOpenWeatherAPI()) {
			if (this.config.location) {
				params += "q=" + this.config.location;
			} else if (this.firstEvent && this.firstEvent.location) {
				params += "q=" + this.firstEvent.location;
			} else if (this.firstEvent && this.firstEvent.geo) {
				params += "q=" + this.firstEvent.geo.lat + "," + this.firstEvent.geo.lon
			} else {
				this.hide(this.config.animationSpeed, { lockString: this.identifier });
				return;
			}
			params += "&key=" + this.config.apiXuKey;
			params += "&days=" + (((this.config.maxNumberOfDays < 1) || (this.config.maxNumberOfDays > 10)) ? 10 : this.config.maxNumberOfDays);
		} else {
			if (this.config.locationID) {
				params += "id=" + this.config.locationID;
			} else if (this.config.location) {
				params += "q=" + this.config.location;
			} else if (this.firstEvent && this.firstEvent.geo) {
				params += "lat=" + this.firstEvent.geo.lat + "&lon=" + this.firstEvent.geo.lon
			} else if (this.firstEvent && this.firstEvent.location) {
				params += "q=" + this.firstEvent.location;
			} else {
				this.hide(this.config.animationSpeed, { lockString: this.identifier });
				return;
			}

			params += "&units=" + this.config.units;
			params += "&lang=" + this.config.lang;
			/*
			 * Submit a specific number of days to forecast, between 1 to 16 days.
			 * The OpenWeatherMap API properly handles values outside of the 1 - 16 range and returns 7 days by default.
			 * This is simply being pedantic and doing it ourselves.
			 */
			params += "&cnt=" + (((this.config.maxNumberOfDays < 1) || (this.config.maxNumberOfDays > 16)) ? 7 : this.config.maxNumberOfDays);
			params += "&APPID=" + this.config.appid;
		}

		return params;
	},

	/* processWeather(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - Weather information received form openweather.org.
	 */
	processWeather: function(data) {
		if (this.isOpenWeatherAPI()) {
			this.processWeatherOpenApi(data);
		} else {
			this.processWeatherXu(data);
		}
	},
	processWeatherXu: function(data) {
		this.fetchedLocationName = data.location.name + ", " + data.location.region;

		this.forecast = [];
		for (var i = 0, count = data.forecast.forecastday.length; i < count; i++) {

			var forecast = data.forecast.forecastday[i];
			var maxTemp = 0;
			var minTemp = 0;
			var rain = 0;
			switch (this.config.units) {
			case "metric":
				maxTemp = forecast.day.maxtemp_c;
				minTemp = forecast.day.mintemp_c;
				rain = forecast.day.totalprecip_mm;
				break;
			case "imperial":
				maxTemp = forecast.day.maxtemp_f;
				minTemp = forecast.day.mintemp_f;
				rain = forecast.day.totalprecip_in;
				break;
			case "default":
				maxTemp = forecast.day.maxtemp_c;
				minTemp = forecast.day.mintemp_c;
				rain = forecast.day.totalprecip_mm;
				break;
			}

			this.forecast.push({

				day: moment(forecast.date_epoch, "X").format("ddd"),
				icon: this.config.iconApiXuTable[forecast.day.condition.code + "-day"],
				maxTemp: this.roundValue(maxTemp),
				minTemp: this.roundValue(minTemp),
				rain: this.roundValue(rain)

			});
		}

		//Log.log(this.forecast);
		this.show(this.config.animationSpeed, { lockString: this.identifier });
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},
	processWeatherOpenApi: function(data) {
		this.fetchedLocationName = data.city.name + ", " + data.city.country;

		this.forecast = [];
		for (var i = 0, count = data.list.length; i < count; i++) {

			var forecast = data.list[i];
			this.forecast.push({

				day: moment(forecast.dt, "X").format("ddd"),
				icon: this.config.iconTable[forecast.weather[0].icon],
				maxTemp: this.roundValue(forecast.temp.max),
				minTemp: this.roundValue(forecast.temp.min),
				rain: this.roundValue(forecast.rain)

			});
		}

		//Log.log(this.forecast);
		this.show(this.config.animationSpeed, { lockString: this.identifier });
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.updateWeather();
		}, nextLoad);
	},

	/* ms2Beaufort(ms)
	 * Converts m2 to beaufort (windspeed).
	 *
	 * see:
	 *  http://www.spc.noaa.gov/faq/tornado/beaufort.html
	 *  https://en.wikipedia.org/wiki/Beaufort_scale#Modern_scale
	 *
	 * argument ms number - Windspeed in m/s.
	 *
	 * return number - Windspeed in beaufort.
	 */
	ms2Beaufort: function(ms) {
		var kmh = ms * 60 * 60 / 1000;
		var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
		for (var beaufort in speeds) {
			var speed = speeds[beaufort];
			if (speed > kmh) {
				return beaufort;
			}
		}
		return 12;
	},

	/* function(temperature)
	 * Rounds a temperature to 1 decimal or integer (depending on config.roundTemp).
	 *
	 * argument temperature number - Temperature.
	 *
	 * return string - Rounded Temperature.
	 */
	roundValue: function(temperature) {
		var decimals = this.config.roundTemp ? 0 : 1;
		return parseFloat(temperature).toFixed(decimals);
	}
});
