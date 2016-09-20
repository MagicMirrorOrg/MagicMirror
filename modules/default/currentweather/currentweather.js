/* global Module */

/* Magic Mirror
 * Module: CurrentWeather
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("currentweather",{

	// Default module config.
	defaults: {
		location: "",
		locationID: "",
		appid: "",
		units: config.units,
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		showPeriod: true,
		showPeriodUpper: false,
		showWindDirection: true,
		useBeaufort: true,
		lang: config.language,

		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,

		apiVersion: "2.5",
		apiBase: "http://api.openweathermap.org/data/",
		weatherEndpoint: "weather",

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
	},

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
		// The translations for the defaut modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionairy.
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
		this.sunriseSunsetTime = null;
		this.sunriseSunsetIcon = null;
		this.temperature = null;
		this.weatherType = null;

		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		this.updateTimer = null;

	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.appid === "") {
			wrapper.innerHTML = "Please set the correct openweather <i>appid</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.location === "") {
			wrapper.innerHTML = "Please set the openweather <i>location</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate('LOADING');
			wrapper.className = "dimmed light small";
			return wrapper;
		}

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
			windDirection.innerHTML = " " + this.translate(this.windDirection);
			small.appendChild(windDirection);
		}
		var spacer = document.createElement("span");
		spacer.innerHTML = "&nbsp;";
		small.appendChild(spacer);

		var sunriseSunsetIcon = document.createElement("span");
		sunriseSunsetIcon.className = "wi dimmed " + this.sunriseSunsetIcon;
		small.appendChild(sunriseSunsetIcon);

		var sunriseSunsetTime = document.createElement("span");
		sunriseSunsetTime.innerHTML = " " + this.sunriseSunsetTime;
		small.appendChild(sunriseSunsetTime);

		var large = document.createElement("div");
		large.className = "large light";

		var weatherIcon = document.createElement("span");
		weatherIcon.className = "wi weathericon " + this.weatherType;
		large.appendChild(weatherIcon);

		var temperature = document.createElement("span");
		temperature.className = "bright";
		temperature.innerHTML = " " + this.temperature + "&deg;";
		large.appendChild(temperature);

		wrapper.appendChild(small);
		wrapper.appendChild(large);
		return wrapper;
	},

	/* updateWeather(compliments)
	 * Requests new data from openweather.org.
	 * Calls processWeather on succesfull response.
	 */
	updateWeather: function() {
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
					self.config.appid = "";
					self.updateDom(self.config.animationSpeed);

					Log.error(self.name + ": Incorrect APPID.");
					retry = false;
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
		if(this.config.locationID !== "") {
			params += "id=" + this.config.locationID;
		} else {
			params += "q=" + this.config.location;
		}
		params += "&units=" + this.config.units;
		params += "&lang=" + this.config.lang;
		params += "&APPID=" + this.config.appid;

		return params;
	},

	/* processWeather(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - Weather information received form openweather.org.
	 */
	processWeather: function(data) {

		if (!data || !data.main || !data.main.temp) {
			// Did not receive usable new data.
			// Maybe this needs a better check?
			return;
		}

		this.temperature = this.roundValue(data.main.temp);

		if (this.config.useBeaufort){
			this.windSpeed = this.ms2Beaufort(this.roundValue(data.wind.speed));
		}else {
			this.windSpeed = parseFloat(data.wind.speed).toFixed(0);
		}


		this.windDirection = this.deg2Cardinal(data.wind.deg);
		this.weatherType = this.config.iconTable[data.weather[0].icon];

		var now = new Date();
		var sunrise = new Date(data.sys.sunrise * 1000);
		var sunset = new Date(data.sys.sunset * 1000);

		// The moment().format('h') method has a bug on the Raspberry Pi.
		// So we need to generate the timestring manually.
		// See issue: https://github.com/MichMich/MagicMirror/issues/181
		var sunriseSunsetDateObject = (sunrise < now && sunset > now) ? sunset : sunrise;
		var timeString = moment(sunriseSunsetDateObject).format('HH:mm');
		if (this.config.timeFormat !== 24) {
			//var hours = sunriseSunsetDateObject.getHours() % 12 || 12;
			if (this.config.showPeriod) {
				if (this.config.showPeriodUpper) {
					//timeString = hours + moment(sunriseSunsetDateObject).format(':mm A');
					timeString = moment(sunriseSunsetDateObject).format('h:mm A');
				} else {
					//timeString = hours + moment(sunriseSunsetDateObject).format(':mm a');
					timeString = moment(sunriseSunsetDateObject).format('h:mm a');
				}
			} else {
				//timeString = hours + moment(sunriseSunsetDateObject).format(':mm');
				timeString = moment(sunriseSunsetDateObject).format('h:mm');
			}
		}

		this.sunriseSunsetTime = timeString;
		this.sunriseSunsetIcon = (sunrise < now && sunset > now) ? "wi-sunset" : "wi-sunrise";



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
		setTimeout(function() {
			self.updateWeather();
		}, nextLoad);
	},

	/* ms2Beaufort(ms)
	 * Converts m2 to beaufort (windspeed).
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
	 * Rounds a temperature to 1 decimal.
	 *
	 * argument temperature number - Temperature.
	 *
	 * return number - Rounded Temperature.
	 */

	deg2Cardinal: function(deg) {
                if (deg>11.25 && deg<=33.75){
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


	roundValue: function(temperature) {
		return parseFloat(temperature).toFixed(1);
	}
});
