/* global WeatherProvider, WeatherObject */

/* Magic Mirror
 * Module: Weather
 * Provider: weather.gov
 *
 * By Vince Peri
 * MIT Licensed.
 *
 * This class is a provider for weather.gov.
 * Note that this is only for US locations (lat and lon) and does not require an API key
 * Since it is free, there are some items missing - like sunrise, sunset, humidity, etc.
 */

WeatherProvider.register("weathergov", {

	// Set the name of the provider.
	// This isn't strictly necessary, since it will fallback to the provider identifier
	// But for debugging (and future alerts) it would be nice to have the real name.
	providerName: "Weather.gov",

	// Overwrite the fetchCurrentWeather method.
	fetchCurrentWeather() {
		this.fetchData(this.getUrl())
			.then(data => {
				if (!data || !data.properties || !data.properties.periods || !data.properties.periods.length) {
					// Did not receive usable new data.
					// Maybe this needs a better check?
					return;
				}

				//this.setFetchedLocation(`${data.name}, ${data.sys.country}`);

				const currentWeather = this.generateWeatherObjectFromCurrentWeather(data.properties.periods[0]);
				this.setCurrentWeather(currentWeather);
			})
			.catch(function(request) {
				Log.error("Could not load data ... ", request);
			})
	},

	// Overwrite the fetchCurrentWeather method.
	fetchWeatherForecast() {
		this.fetchData(this.getUrl())
			.then(data => {
				if (!data || !data.properties || !data.properties.periods || !data.properties.periods.length) {
					// Did not receive usable new data.
					// Maybe this needs a better check?
					return;
				}

				//this.setFetchedLocation(`${data.city.name}, ${data.city.country}`);

				const forecast = this.generateWeatherObjectsFromForecast(data.properties.periods);
				this.setWeatherForecast(forecast);
			})
			.catch(function(request) {
				Log.error("Could not load data ... ", request);
			})
	},

	/** Weather.gov Specific Methods - These are not part of the default provider methods */
	/*
	 * Gets the complete url for the request
	 */
	getUrl() {
		return this.config.apiBase + this.config.lat + "," + this.config.lon + this.config.weatherEndpoint;
	},

	/*
	 * Generate a WeatherObject based on currentWeatherInformation
	 */
	generateWeatherObjectFromCurrentWeather(currentWeatherData) {
		const currentWeather = new WeatherObject(this.config.units);

		//currentWeather.humidity = currentWeatherData.main.humidity;
		currentWeather.temperature = currentWeatherData.temperature;
		currentWeather.windSpeed = currentWeatherData.windSpeed.split(" ", 1);
		currentWeather.windDirection = this.convertDirectiontoDegrees(currentWeatherData.windDirection);
		currentWeather.weatherType = this.convertWeatherType(currentWeatherData.shortForecast, currentWeatherData.isDaytime);
		//currentWeather.sunrise = moment(currentWeatherData.sys.sunrise, "X");
		//currentWeather.sunset = moment(currentWeatherData.sys.sunset, "X");

		return currentWeather;
	},

	/*
	 * Generate WeatherObjects based on forecast information
	 */
	generateWeatherObjectsFromForecast(forecasts) {
		return this.fetchForecastDaily(forecasts);
	},

	/*
	 * fetch forecast information for daily forecast.
	 */
	fetchForecastDaily(forecasts) {
		// initial variable declaration
		const days = [];
		// variables for temperature range and rain
		var minTemp = [];
		var maxTemp = [];
		// variable for date
		let date = "";
		var weather = new WeatherObject(this.config.units);
		weather.precipitation = 0;

		for (const forecast of forecasts) {

			if (date !== moment(forecast.startTime).format("YYYY-MM-DD")) {

				// calculate minimum/maximum temperature, specify rain amount
				weather.minTemperature = Math.min.apply(null, minTemp);
				weather.maxTemperature = Math.max.apply(null, maxTemp);

				// push weather information to days array
				days.push(weather);
				// create new weather-object
				weather = new WeatherObject(this.config.units);

				minTemp = [];
				maxTemp = [];
				weather.precipitation = 0;

				// set new date
				date = moment(forecast.startTime).format("YYYY-MM-DD");

				// specify date
				weather.date = moment(forecast.startTime);

				// If the first value of today is later than 17:00, we have an icon at least!
				weather.weatherType = this.convertWeatherType(forecast.shortForecast, forecast.isDaytime);
			}

			if (moment(forecast.startTime).format("H") >= 8 && moment(forecast.startTime).format("H") <= 17) {
				weather.weatherType = this.convertWeatherType(forecast.shortForecast, forecast.isDaytime);
			}

			// the same day as before
			// add values from forecast to corresponding variables
			minTemp.push(forecast.temperature);
			maxTemp.push(forecast.temperature);
		}
		
		// last day
		// calculate minimum/maximum temperature, specify rain amount
		weather.minTemperature = Math.min.apply(null, minTemp);
		weather.maxTemperature = Math.max.apply(null, maxTemp);

		// push weather information to days array
		days.push(weather);
		return days.slice(1);
	},

	/*
	 * Convert the icons to a more usable name.
	 */
	convertWeatherType(weatherType, isDaytime) {
		//https://w1.weather.gov/xml/current_obs/weather.php
		// There are way too many types to create, so lets just look for certain strings

		if (weatherType.includes("Cloudy") || weatherType.includes("Partly")) {
			if (isDaytime) {
				return "day-cloudy";
			} else {
				return "night-cloudy";
			}
		} else if (weatherType.includes("Overcast")) {
			if (isDaytime) {
				return "cloudy";
			} else {
				return "night-cloudy";
			}
		} else if (weatherType.includes("Freezing") || weatherType.includes("Ice")) {
			return "rain-mix";
		} else if (weatherType.includes("Snow")) {
			if (isDaytime) {
				return "snow";
			} else {
				return "night-snow";
			}
		} else if (weatherType.includes("Thunderstorm")) {
			if (isDaytime) {
				return "thunderstorm";
			} else {
				return "night-thunderstorm";
			}
		} else if (weatherType.includes("Showers")) {
			if (isDaytime) {
				return "showers";
			} else {
				return "night-showers";
			}
		} else if (weatherType.includes("Rain")) {
			if (isDaytime) {
				return "rain";
			} else {
				return "night-rain";
			}
		} else if (weatherType.includes("Breezy") || weatherType.includes("Windy")) {
			if (isDaytime) {
				return "cloudy-windy";
			} else {
				return "night-alt-cloudy-windy";
			}
		} else if (weatherType.includes("Fair") || weatherType.includes("Clear") || weatherType.includes("Few")) {
			if (isDaytime) {
				return "day-sunny";
			} else {
				return "night-clear";
			}
		} else if (weatherType.includes("Fog")) {
			return "fog";
		} else if (weatherType.includes("Smoke")) {
			return "smoke";
		} else if (weatherType.includes("Haze")) {
			return "day-haze";
		}

		return null;
	},

	/* getParams(compliments)
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams() {
		
	},

	/*
	Convert the direction into Degrees
	*/
	convertDirectiontoDegrees(direction) {
		if (direction === "NNE"){
			return 33.75;
		} else if (direction === "NE") {
			return 56.25;
		} else if (direction === "ENE") {
			return 78.75;
		} else if (direction === "E") {
			return 101.25;
		} else if (direction === "ESE") {
			return 123.75;
		} else if (direction === "SE") {
			return 146.25;
		} else if (direction === "SSE") {
			return 168.75;
		} else if (direction === "S") {
			return 191.25;
		} else if (direction === "SSW") {
			return 213.75;
		} else if (direction === "SW") {
			return 236.25;
		} else if (direction === "WSW") {
			return 258.75;
		} else if (direction === "W") {
			return 281.25;
		} else if (direction === "WNW") {
			return 303.75;
		} else if (direction === "NW") {
			return 326.25;
		} else if (direction === "NNW") {
			return 348.75;
		}
	}
});
