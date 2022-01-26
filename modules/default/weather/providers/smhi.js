/* global WeatherProvider, WeatherObject */

/* MagicMirror²
 * Module: Weather
 * Provider: SMHI
 *
 * By BuXXi https://github.com/buxxi
 * MIT Licensed
 *
 * This class is a provider for SMHI (Sweden only). Metric system is the only
 * supported unit.
 */
WeatherProvider.register("smhi", {
	providerName: "SMHI",

	// Set the default config properties that is specific to this provider
	defaults: {
		lat: 0,
		lon: 0,
		precipitationValue: "pmedian"
	},

	/**
	 * Implements method in interface for fetching current weather
	 */
	fetchCurrentWeather() {
		this.fetchData(this.getURL())
			.then((data) => {
				let closest = this.getClosestToCurrentTime(data.timeSeries);
				let coordinates = this.resolveCoordinates(data);
				let weatherObject = this.convertWeatherDataToObject(closest, coordinates);
				this.setFetchedLocation(`(${coordinates.lat},${coordinates.lon})`);
				this.setCurrentWeather(weatherObject);
			})
			.catch((error) => Log.error("Could not load data: " + error.message))
			.finally(() => this.updateAvailable());
	},

	/**
	 * Implements method in interface for fetching a forecast.
	 * Handling hourly forecast would be easy as not grouping by day but it seems really specific for one weather provider for now.
	 */
	fetchWeatherForecast() {
		this.fetchData(this.getURL())
			.then((data) => {
				let coordinates = this.resolveCoordinates(data);
				let weatherObjects = this.convertWeatherDataGroupedByDay(data.timeSeries, coordinates);
				this.setFetchedLocation(`(${coordinates.lat},${coordinates.lon})`);
				this.setWeatherForecast(weatherObjects);
			})
			.catch((error) => Log.error("Could not load data: " + error.message))
			.finally(() => this.updateAvailable());
	},

	/**
	 * Overrides method for setting config with checks for the precipitationValue being unset or invalid
	 *
	 * @param {object} config The configuration object
	 */
	setConfig(config) {
		this.config = config;
		if (!config.precipitationValue || ["pmin", "pmean", "pmedian", "pmax"].indexOf(config.precipitationValue) === -1) {
			console.log("invalid or not set: " + config.precipitationValue);
			config.precipitationValue = this.defaults.precipitationValue;
		}
	},

	/**
	 * Of all the times returned find out which one is closest to the current time, should be the first if the data isn't old.
	 *
	 * @param {object[]} times Array of time objects
	 * @returns {object} The weatherdata closest to the current time
	 */
	getClosestToCurrentTime(times) {
		let now = moment();
		let minDiff = undefined;
		for (const time of times) {
			let diff = Math.abs(moment(time.validTime).diff(now));
			if (!minDiff || diff < Math.abs(moment(minDiff.validTime).diff(now))) {
				minDiff = time;
			}
		}
		return minDiff;
	},

	/**
	 * Get the forecast url for the configured coordinates
	 *
	 * @returns {string} the url for the specified coordinates
	 */
	getURL() {
		let lon = this.config.lon;
		let lat = this.config.lat;
		return `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon}/lat/${lat}/data.json`;
	},

	/**
	 * Converts the returned data into a WeatherObject with required properties set for both current weather and forecast.
	 * The returned units is always in metric system.
	 * Requires coordinates to determine if its daytime or nighttime to know which icon to use and also to set sunrise and sunset.
	 *
	 * @param {object} weatherData Weatherdata to convert
	 * @param {object} coordinates Coordinates of the locations of the weather
	 * @returns {WeatherObject} The converted weatherdata at the specified location
	 */
	convertWeatherDataToObject(weatherData, coordinates) {
		// Weather data is only for Sweden and nobody in Sweden would use imperial
		let currentWeather = new WeatherObject("metric", "metric", "metric");

		currentWeather.date = moment(weatherData.validTime);
		currentWeather.updateSunTime(coordinates.lat, coordinates.lon);
		currentWeather.humidity = this.paramValue(weatherData, "r");
		currentWeather.temperature = this.paramValue(weatherData, "t");
		currentWeather.windSpeed = this.paramValue(weatherData, "ws");
		currentWeather.windDirection = this.paramValue(weatherData, "wd");
		currentWeather.weatherType = this.convertWeatherType(this.paramValue(weatherData, "Wsymb2"), currentWeather.isDayTime());

		// Determine the precipitation amount and category and update the
		// weatherObject with it, the valuetype to use can be configured or uses
		// median as default.
		let precipitationValue = this.paramValue(weatherData, this.config.precipitationValue);
		switch (this.paramValue(weatherData, "pcat")) {
			// 0 = No precipitation
			case 1: // Snow
				currentWeather.snow += precipitationValue;
				currentWeather.precipitation += precipitationValue;
				break;
			case 2: // Snow and rain, treat it as 50/50 snow and rain
				currentWeather.snow += precipitationValue / 2;
				currentWeather.rain += precipitationValue / 2;
				currentWeather.precipitation += precipitationValue;
				break;
			case 3: // Rain
			case 4: // Drizzle
			case 5: // Freezing rain
			case 6: // Freezing drizzle
				currentWeather.rain += precipitationValue;
				currentWeather.precipitation += precipitationValue;
				break;
		}

		return currentWeather;
	},

	/**
	 * Takes all of the data points and converts it to one WeatherObject per day.
	 *
	 * @param {object[]} allWeatherData Array of weatherdata
	 * @param {object} coordinates Coordinates of the locations of the weather
	 * @returns {WeatherObject[]} Array of weatherobjects
	 */
	convertWeatherDataGroupedByDay(allWeatherData, coordinates) {
		let currentWeather;
		let result = [];

		let allWeatherObjects = this.fillInGaps(allWeatherData).map((weatherData) => this.convertWeatherDataToObject(weatherData, coordinates));
		let dayWeatherTypes = [];

		for (const weatherObject of allWeatherObjects) {
			//If its the first object or if a day change we need to reset the summary object
			if (!currentWeather || !currentWeather.date.isSame(weatherObject.date, "day")) {
				currentWeather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits);
				dayWeatherTypes = [];
				currentWeather.date = weatherObject.date;
				currentWeather.minTemperature = Infinity;
				currentWeather.maxTemperature = -Infinity;
				currentWeather.snow = 0;
				currentWeather.rain = 0;
				currentWeather.precipitation = 0;
				result.push(currentWeather);
			}

			//Keep track of what icons has been used for each hour of daytime and use the middle one for the forecast
			if (weatherObject.isDayTime()) {
				dayWeatherTypes.push(weatherObject.weatherType);
			}
			if (dayWeatherTypes.length > 0) {
				currentWeather.weatherType = dayWeatherTypes[Math.floor(dayWeatherTypes.length / 2)];
			} else {
				currentWeather.weatherType = weatherObject.weatherType;
			}

			//All other properties is either a sum, min or max of each hour
			currentWeather.minTemperature = Math.min(currentWeather.minTemperature, weatherObject.temperature);
			currentWeather.maxTemperature = Math.max(currentWeather.maxTemperature, weatherObject.temperature);
			currentWeather.snow += weatherObject.snow;
			currentWeather.rain += weatherObject.rain;
			currentWeather.precipitation += weatherObject.precipitation;
		}

		return result;
	},

	/**
	 * Resolve coordinates from the response data (probably preferably to use
	 * this if it's not matching the config values exactly)
	 *
	 * @param {object} data Response data from the weather service
	 * @returns {{lon, lat}} the lat/long coordinates of the data
	 */
	resolveCoordinates(data) {
		return { lat: data.geometry.coordinates[0][1], lon: data.geometry.coordinates[0][0] };
	},

	/**
	 * The distance between the data points is increasing in the data the more distant the prediction is.
	 * Find these gaps and fill them with the previous hours data to make the data returned a complete set.
	 *
	 * @param {object[]} data Response data from the weather service
	 * @returns {object[]} Given data with filled gaps
	 */
	fillInGaps(data) {
		let result = [];
		for (let i = 1; i < data.length; i++) {
			let to = moment(data[i].validTime);
			let from = moment(data[i - 1].validTime);
			let hours = moment.duration(to.diff(from)).asHours();
			// For each hour add a datapoint but change the validTime
			for (let j = 0; j < hours; j++) {
				let current = Object.assign({}, data[i]);
				current.validTime = from.clone().add(j, "hours").toISOString();
				result.push(current);
			}
		}
		return result;
	},

	/**
	 * Helper method to get a property from the returned data set.
	 *
	 * @param {object} currentWeatherData Weatherdata to get from
	 * @param {string} name The name of the property
	 * @returns {*} The value of the property in the weatherdata
	 */
	paramValue(currentWeatherData, name) {
		return currentWeatherData.parameters.filter((p) => p.name === name).flatMap((p) => p.values)[0];
	},

	/**
	 * Map the icon value from SMHI to an icon that MagicMirror² understands.
	 * Uses different icons depending if its daytime or nighttime.
	 * SMHI's description of what the numeric value means is the comment after the case.
	 *
	 * @param {number} input The SMHI icon value
	 * @param {boolean} isDayTime True if the icon should be for daytime, false for nighttime
	 * @returns {string} The icon name for the MagicMirror
	 */
	convertWeatherType(input, isDayTime) {
		switch (input) {
			case 1:
				return isDayTime ? "day-sunny" : "night-clear"; // Clear sky
			case 2:
				return isDayTime ? "day-sunny-overcast" : "night-partly-cloudy"; // Nearly clear sky
			case 3:
				return isDayTime ? "day-cloudy" : "night-cloudy"; // Variable cloudiness
			case 4:
				return isDayTime ? "day-cloudy" : "night-cloudy"; // Halfclear sky
			case 5:
				return "cloudy"; // Cloudy sky
			case 6:
				return "cloudy"; // Overcast
			case 7:
				return "fog"; // Fog
			case 8:
				return "showers"; // Light rain showers
			case 9:
				return "showers"; // Moderate rain showers
			case 10:
				return "showers"; // Heavy rain showers
			case 11:
				return "thunderstorm"; // Thunderstorm
			case 12:
				return "sleet"; // Light sleet showers
			case 13:
				return "sleet"; // Moderate sleet showers
			case 14:
				return "sleet"; // Heavy sleet showers
			case 15:
				return "snow"; // Light snow showers
			case 16:
				return "snow"; // Moderate snow showers
			case 17:
				return "snow"; // Heavy snow showers
			case 18:
				return "rain"; // Light rain
			case 19:
				return "rain"; // Moderate rain
			case 20:
				return "rain"; // Heavy rain
			case 21:
				return "thunderstorm"; // Thunder
			case 22:
				return "sleet"; // Light sleet
			case 23:
				return "sleet"; // Moderate sleet
			case 24:
				return "sleet"; // Heavy sleet
			case 25:
				return "snow"; // Light snowfall
			case 26:
				return "snow"; // Moderate snowfall
			case 27:
				return "snow"; // Heavy snowfall
			default:
				return "";
		}
	}
});
