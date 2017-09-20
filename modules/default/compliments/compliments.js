/* global Log, Module, moment */

/* Magic Mirror
 * Module: Compliments
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("compliments", {

	// Module config defaults.
	defaults: {
		compliments: {
			anytime: [
				"Hey there sexy!"
			],
			morning: [
				"Good morning, handsome!",
				"Enjoy your day!",
				"How was your sleep?"
			],
			afternoon: [
				"Hello, beauty!",
				"You look sexy!",
				"Looking good today!"
			],
			evening: [
				"Wow, you look hot!",
				"You look nice!",
				"Hi, sexy!"
			]
		},
		updateInterval: 30000,
		remoteFile: null,
		fadeSpeed: 4000
	},

	// Set currentweather from module
	currentWeatherType: "",

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		this.lastComplimentIndex = -1;

		if (this.config.remoteFile != null) {
			this.complimentFile((response) => {
				this.config.compliments = JSON.parse(response);
			});
		}

		// Schedule update timer.
		var self = this;
		setInterval(function() {
			self.updateDom(self.config.fadeSpeed);
		}, this.config.updateInterval);
	},

	/* randomIndex(compliments)
	 * Generate a random index for a list of compliments.
	 *
	 * argument compliments Array<String> - Array with compliments.
	 *
	 * return Number - Random index.
	 */
	randomIndex: function(compliments) {
		if (compliments.length === 1) {
			return 0;
		}

		var generate = function() {
			return Math.floor(Math.random() * compliments.length);
		};

		var complimentIndex = generate();

		while (complimentIndex === this.lastComplimentIndex) {
			complimentIndex = generate();
		}

		this.lastComplimentIndex = complimentIndex;

		return complimentIndex;
	},

	/* complimentArray()
	 * Retrieve an array of compliments for the time of the day.
	 *
	 * return compliments Array<String> - Array with compliments for the time of the day.
	 */
	complimentArray: function() {
		var hour = moment().hour();
		var compliments;

		if (hour >= 3 && hour < 12 && this.config.compliments.hasOwnProperty("morning")) {
			compliments = this.config.compliments.morning.slice(0);
		} else if (hour >= 12 && hour < 17 && this.config.compliments.hasOwnProperty("afternoon")) {
			compliments = this.config.compliments.afternoon.slice(0);
		} else if(this.config.compliments.hasOwnProperty("evening")) {
			compliments = this.config.compliments.evening.slice(0);
		}

		if (typeof compliments === "undefined") {
			compliments = new Array();
		}

		if (this.currentWeatherType in this.config.compliments) {
			compliments.push.apply(compliments, this.config.compliments[this.currentWeatherType]);
		}

		compliments.push.apply(compliments, this.config.compliments.anytime);

		return compliments;
	},

	/* complimentFile(callback)
	 * Retrieve a file from the local filesystem
	 */
	complimentFile: function(callback) {
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open("GET", this.file(this.config.remoteFile), true);
		xobj.onreadystatechange = function() {
			if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);
	},

	/* complimentArray()
	 * Retrieve a random compliment.
	 *
	 * return compliment string - A compliment.
	 */
	randomCompliment: function() {
		var compliments = this.complimentArray();
		var index = this.randomIndex(compliments);

		return compliments[index];
	},

	// Override dom generator.
	getDom: function() {
		var complimentText = this.randomCompliment();

		var compliment = document.createTextNode(complimentText);
		var wrapper = document.createElement("div");
		wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright";
		wrapper.appendChild(compliment);

		return wrapper;
	},


	// From data currentweather set weather type
	setCurrentWeatherType: function(data) {
		var weatherIconTable = {
			"01d": "day_sunny",
			"02d": "day_cloudy",
			"03d": "cloudy",
			"04d": "cloudy_windy",
			"09d": "showers",
			"10d": "rain",
			"11d": "thunderstorm",
			"13d": "snow",
			"50d": "fog",
			"01n": "night_clear",
			"02n": "night_cloudy",
			"03n": "night_cloudy",
			"04n": "night_cloudy",
			"09n": "night_showers",
			"10n": "night_rain",
			"11n": "night_thunderstorm",
			"13n": "night_snow",
			"50n": "night_alt_cloudy_windy"
		};
    var iconApiXuTable = {
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
    }
    if(data.weather) {
      this.currentWeatherType = weatherIconTable[data.weather[0].icon];
    } else {
      this.currentWeatherType = iconApiXuTable[data.current.condition.code];

    }
	},


	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		if (notification == "CURRENTWEATHER_DATA") {
			this.setCurrentWeatherType(payload.data);
		}
	},

});