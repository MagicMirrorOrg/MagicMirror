/* global Module */

/* Magic Mirror
 * Module: CurrentWeather
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("currentweather", {

	// Default module config.
	defaults: {
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

		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,

		apiVersion: "2.5",
		apiBase: "http://api.openweathermap.org/data/",
		weatherEndpoint: "weather",

		apiXuVersion: "v1",
		apiXuBase: "https://api.apixu.com/",
		apiXuWeatherEndpoint: "forecast.json",

		appendLocationNameToHeader: true,
		calendarClass: "calendar",

		onlyTemp: false,
		roundTemp: false,

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
	fetchedLocatioName: "",

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define required scripts.
	getStyles: function() {
		return ["weather-icons.css", "currentweather.css"];
	},

	// Define required translations.
	getTranslations: function() {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build yiur own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.windSpeed = null;
		this.windDirection = null;
		this.windDeg = null;
		this.sunriseSunsetTime = null;
		this.sunriseSunsetIcon = null;
		this.temperature = null;
		this.indoorTemperature = null;
		this.weatherType = null;

		this.loaded = false;
		if (!this.isOpenWeatherAPI()) {
			this.config.apiBase = this.config.apiXuBase;
			this.config.apiVersion = this.config.apiXuVersion;
			this.config.weatherEndpoint = this.config.apiXuWeatherEndpoint;
		}
		this.scheduleUpdate(this.config.initialLoadDelay);

	},

	//which API to use
	isOpenWeatherAPI: function() {
		return this.config.appid ? true : false;
	},
	// add extra information of current weather
	// windDirection, humidity, sunrise and sunset
	addExtraInfoWeather: function(wrapper) {

		var small = document.createElement("div");
		small.className = "normal medium";

		var windIcon = document.createElement("span");
		windIcon.className = "wi wi-strong-wind dimmed";
		small.appendChild(windIcon);

		var windSpeed = document.createElement("span");
		windSpeed.innerHTML = " " + this.windSpeed;
		small.appendChild(windSpeed);

		if (this.config.showWindDirection) {
			var windDirection = document.createElement("sup");
			if (this.config.showWindDirectionAsArrow) {
				if (this.windDeg !== null) {
					windDirection.innerHTML = " &nbsp;<i class=\"fa fa-long-arrow-down\" style=\"transform:rotate(" + this.windDeg + "deg);\"></i>&nbsp;";
				}
			} else {
				windDirection.innerHTML = " " + this.translate(this.windDirection);
			}
			small.appendChild(windDirection);
		}
		var spacer = document.createElement("span");
		spacer.innerHTML = "&nbsp;";
		small.appendChild(spacer);

		if (this.config.showHumidity) {
			var humidity = document.createElement("span");
			humidity.innerHTML = this.humidity;

			var spacer = document.createElement("sup");
			spacer.innerHTML = "&nbsp;";

			var humidityIcon = document.createElement("sup");
			humidityIcon.className = "wi wi-humidity humidityIcon";
			humidityIcon.innerHTML = "&nbsp;";

			small.appendChild(humidity);
			small.appendChild(spacer);
			small.appendChild(humidityIcon);
		}

		var sunriseSunsetIcon = document.createElement("span");
		sunriseSunsetIcon.className = "wi dimmed " + this.sunriseSunsetIcon;
		small.appendChild(sunriseSunsetIcon);

		var sunriseSunsetTime = document.createElement("span");
		sunriseSunsetTime.innerHTML = " " + this.sunriseSunsetTime;
		small.appendChild(sunriseSunsetTime);

		wrapper.appendChild(small);
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

		if (this.config.onlyTemp === false) {
			this.addExtraInfoWeather(wrapper);
		}

		var large = document.createElement("div");
		large.className = "large light";

		var weatherIcon = document.createElement("span");
		weatherIcon.className = "wi weathericon " + this.weatherType;
		large.appendChild(weatherIcon);

		var degreeLabel = "";
		if (this.config.degreeLabel) {
			switch (this.config.units) {
			case "metric":
				degreeLabel = "C";
				break;
			case "imperial":
				degreeLabel = "F";
				break;
			case "default":
				degreeLabel = "K";
				break;
			}
		}

		var temperature = document.createElement("span");
		temperature.className = "bright";
		temperature.innerHTML = " " + this.temperature + "&deg;" + degreeLabel;
		large.appendChild(temperature);

		if (this.config.showIndoorTemperature && this.indoorTemperature) {
			var indoorIcon = document.createElement("span");
			indoorIcon.className = "fa fa-home";
			large.appendChild(indoorIcon);

			var indoorTemperatureElem = document.createElement("span");
			indoorTemperatureElem.className = "bright";
			indoorTemperatureElem.innerHTML = " " + this.indoorTemperature + "&deg;" + degreeLabel;
			large.appendChild(indoorTemperatureElem);
		}

		wrapper.appendChild(large);
		return wrapper;
	},

	// Override getHeader method.
	getHeader: function() {
		if (this.config.appendLocationNameToHeader) {
			return this.data.header + " " + this.fetchedLocatioName;
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
		if (notification === "INDOOR_TEMPERATURE") {
			this.indoorTemperature = this.roundValue(payload);
			this.updateDom(self.config.animationSpeed);
		}
	},

	/* updateWeather(compliments)
	 * Requests new data from openweather.org.
	 * Calls processWeather on succesfull response.
	 */
	updateWeather: function() {
		if (this.config.appid === "" && this.config.apiXuKey === "") {
			Log.error("CurrentWeather: APPID or APIXUKEY not set!");
			return;
		}
		var url = this.config.apiBase + this.config.apiVersion + "/" + this.config.weatherEndpoint + this.getParams();
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
			params += "&days=1";
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
			this.procesWeatherXuApi(data);
		}
	},

	procesWeatherXuApi: function(data) {
		if (!data || !data.current || typeof data.current.temp_c === "undefined") {
			// Did not receive usable new data.
			// Maybe this needs a better check?
			return;
		}

		this.humidity = parseFloat(data.current.humidity);
		var currentTemp = 0;
		var windSpeed = 0;
		switch (this.config.units) {
		case "metric":
			currentTemp = data.current.temp_c;
			windSpeed = data.current.wind_kph;
			break;
		case "imperial":
			currentTemp = data.current.temp_f;
			windSpeed = data.current.wind_mph;
			break;
		case "default":
			currentTemp = data.current.temp_c;
			windSpeed = data.current.wind_kph;
			break;
		}

		this.temperature = this.roundValue(currentTemp);

		if (this.config.useBeaufort) {
			this.windSpeed = this.ms2Beaufort(this.roundValue(windSpeed));
		} else {
			this.windSpeed = parseFloat(windSpeed).toFixed(0);
		}

		this.windDirection = data.current.wind_dir;
		this.windDeg = data.current.wind_degree;
		var iconType = data.current.condition.code + (data.current.is_day == 1 ? "-day" : "-night");
		var icon = this.config.iconApiXuTable[iconType]
		this.weatherType = icon;
		data.current.condition["weatherIcon"] = icon;
		var now = new Date();
		var sunrise = data.forecast.forecastday[0].astro.sunrise;
		var sunset = data.forecast.forecastday[0].astro.sunset;

		this.sunriseSunsetTime = sunset;
		this.sunriseSunsetIcon = (data.current.is_day === 1) ? "wi-sunset" : "wi-sunrise";

		this.show(this.config.animationSpeed, { lockString: this.identifier });
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
		this.sendNotification("CURRENTWEATHER_DATA", { data: data });
	},

	processWeatherOpenApi: function(data) {
		if (!data || !data.main || typeof data.main.temp === "undefined") {
			// Did not receive usable new data.
			// Maybe this needs a better check?
			return;
		}

		this.humidity = parseFloat(data.main.humidity);
		this.temperature = this.roundValue(data.main.temp);

		if (this.config.useBeaufort) {
			this.windSpeed = this.ms2Beaufort(this.roundValue(data.wind.speed));
		} else {
			this.windSpeed = parseFloat(data.wind.speed).toFixed(0);
		}

		this.windDirection = this.deg2Cardinal(data.wind.deg);
		this.windDeg = data.wind.deg;
		this.weatherType = this.config.iconTable[data.weather[0].icon];

		var now = new Date();
		var sunrise = new Date(data.sys.sunrise * 1000);
		var sunset = new Date(data.sys.sunset * 1000);

		// The moment().format('h') method has a bug on the Raspberry Pi.
		// So we need to generate the timestring manually.
		// See issue: https://github.com/MichMich/MagicMirror/issues/181
		var sunriseSunsetDateObject = (sunrise < now && sunset > now) ? sunset : sunrise;
		var timeString = moment(sunriseSunsetDateObject).format("HH:mm");
		if (this.config.timeFormat !== 24) {
			//var hours = sunriseSunsetDateObject.getHours() % 12 || 12;
			if (this.config.showPeriod) {
				if (this.config.showPeriodUpper) {
					//timeString = hours + moment(sunriseSunsetDateObject).format(':mm A');
					timeString = moment(sunriseSunsetDateObject).format("h:mm A");
				} else {
					//timeString = hours + moment(sunriseSunsetDateObject).format(':mm a');
					timeString = moment(sunriseSunsetDateObject).format("h:mm a");
				}
			} else {
				//timeString = hours + moment(sunriseSunsetDateObject).format(':mm');
				timeString = moment(sunriseSunsetDateObject).format("h:mm");
			}
		}

		this.sunriseSunsetTime = timeString;
		this.sunriseSunsetIcon = (sunrise < now && sunset > now) ? "wi-sunset" : "wi-sunrise";

		this.show(this.config.animationSpeed, { lockString: this.identifier });
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
		this.sendNotification("CURRENTWEATHER_DATA", { data: data });
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
		setTimeout(function() {
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

	deg2Cardinal: function(deg) {
		if (deg > 11.25 && deg <= 33.75) {
			return "NNE";
		} else if (deg > 33.75 && deg <= 56.25) {
			return "NE";
		} else if (deg > 56.25 && deg <= 78.75) {
			return "ENE";
		} else if (deg > 78.75 && deg <= 101.25) {
			return "E";
		} else if (deg > 101.25 && deg <= 123.75) {
			return "ESE";
		} else if (deg > 123.75 && deg <= 146.25) {
			return "SE";
		} else if (deg > 146.25 && deg <= 168.75) {
			return "SSE";
		} else if (deg > 168.75 && deg <= 191.25) {
			return "S";
		} else if (deg > 191.25 && deg <= 213.75) {
			return "SSW";
		} else if (deg > 213.75 && deg <= 236.25) {
			return "SW";
		} else if (deg > 236.25 && deg <= 258.75) {
			return "WSW";
		} else if (deg > 258.75 && deg <= 281.25) {
			return "W";
		} else if (deg > 281.25 && deg <= 303.75) {
			return "WNW";
		} else if (deg > 303.75 && deg <= 326.25) {
			return "NW";
		} else if (deg > 326.25 && deg <= 348.75) {
			return "NNW";
		} else {
			return "N";
		}
	},

	/* function(temperature)
	 * Rounds a temperature to 1 decimal or integer (depending on config.roundTemp).
	 *
	 * argument temperature number - Temperature.
	 *
	 * return number - Rounded Temperature.
	 */
	roundValue: function(temperature) {
		var decimals = this.config.roundTemp ? 0 : 1;
		return parseFloat(temperature).toFixed(decimals);
	}
});
