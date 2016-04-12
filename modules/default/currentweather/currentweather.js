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
		appid: "",
		units: "metric",
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
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

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.windSpeed = null;
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
			wrapper.innerHTML = "Loading weather ...";
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
		params += "q=" + this.config.location;
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
		this.temperature = this.roundValue(data.main.temp);
		this.windSpeed = this.ms2Beaufort(this.roundValue(data.wind.speed));
		this.weatherType = this.config.iconTable[data.weather[0].icon];

		var now = moment().format("x");
		var sunrise = moment(data.sys.sunrise * 1000).format("x");
		var sunset = moment(data.sys.sunset * 1000).format("x");

		if (sunrise < now && sunset > now) {
			this.sunriseSunsetTime = moment(data.sys.sunset * 1000).format((this.config.timeFormat === 24) ? "HH:mm" : "hh:mm a");
			this.sunriseSunsetIcon = "wi-sunset";
		} else {
			this.sunriseSunsetTime = moment(data.sys.sunrise * 1000).format((this.config.timeFormat === 24) ? "HH:mm" : "hh:mm a");
			this.sunriseSunsetIcon = "wi-sunrise";

		}

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
	roundValue: function(temperature) {
		return parseFloat(temperature).toFixed(1);
	}
});
