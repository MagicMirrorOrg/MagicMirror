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

				const currentWeather = this.generateWeatherObjectFromCurrentWeather(data.properties.periods[0]);
				this.setCurrentWeather(currentWeather);
			})
			.catch(function(request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable())
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

				const forecast = this.generateWeatherObjectsFromForecast(data.properties.periods);
				this.setWeatherForecast(forecast);
			})
			.catch(function(request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable())
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
		const currentWeather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits);

		currentWeather.temperature = currentWeatherData.temperature;
		currentWeather.windSpeed = currentWeatherData.windSpeed.split(" ", 1);
		currentWeather.windDirection = this.convertWindDirection(currentWeatherData.windDirection);
		currentWeather.weatherType = this.convertWeatherType(currentWeatherData.shortForecast, currentWeatherData.isDaytime);

		// determine the sunrise/sunset times - not supplied in weather.gov data
		let times = this.calcAstroData(this.config.lat, this.config.lon)
		currentWeather.sunrise = times[0];
		currentWeather.sunset = times[1];

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
		let minTemp = [];
		let maxTemp = [];
		// variable for date
		let date = "";
		let weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits);
		weather.precipitation = 0;

		for (const forecast of forecasts) {

			if (date !== moment(forecast.startTime).format("YYYY-MM-DD")) {

				// calculate minimum/maximum temperature, specify rain amount
				weather.minTemperature = Math.min.apply(null, minTemp);
				weather.maxTemperature = Math.max.apply(null, maxTemp);

				// push weather information to days array
				days.push(weather);
				// create new weather-object
				weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits);

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
		// calculate minimum/maximum temperature
		weather.minTemperature = Math.min.apply(null, minTemp);
		weather.maxTemperature = Math.max.apply(null, maxTemp);

		// push weather information to days array
		days.push(weather);
		return days.slice(1);
	},

	/*
	 * Calculate the astronomical data
	 */
	calcAstroData(lat, lon) {
		const sunTimes = [];

		// determine the sunrise/sunset times
		let times = SunCalc.getTimes(new Date(), lat, lon);
		sunTimes.push(moment(times.sunrise, "X"));
		sunTimes.push(moment(times.sunset, "X"));

		return sunTimes;
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
			}

			return "night-cloudy";
		} else if (weatherType.includes("Overcast")) {
			if (isDaytime) {
				return "cloudy";
			}

			return "night-cloudy";
		} else if (weatherType.includes("Freezing") || weatherType.includes("Ice")) {
			return "rain-mix";
		} else if (weatherType.includes("Snow")) {
			if (isDaytime) {
				return "snow";
			}

			return "night-snow";
		} else if (weatherType.includes("Thunderstorm")) {
			if (isDaytime) {
				return "thunderstorm";
			}

			return "night-thunderstorm";
		} else if (weatherType.includes("Showers")) {
			if (isDaytime) {
				return "showers";
			}

			return "night-showers";
		} else if (weatherType.includes("Rain") || weatherType.includes("Drizzle")) {
			if (isDaytime) {
				return "rain";
			}

			return "night-rain";
		} else if (weatherType.includes("Breezy") || weatherType.includes("Windy")) {
			if (isDaytime) {
				return "cloudy-windy";
			}

			return "night-alt-cloudy-windy";
		} else if (weatherType.includes("Fair") || weatherType.includes("Clear") || weatherType.includes("Few") || weatherType.includes("Sunny")) {
			if (isDaytime) {
				return "day-sunny";
			}

			return "night-clear";
		} else if (weatherType.includes("Dust") || weatherType.includes("Sand")) {
			return "dust";
		} else if (weatherType.includes("Fog")) {
			return "fog";
		} else if (weatherType.includes("Smoke")) {
			return "smoke";
		} else if (weatherType.includes("Haze")) {
			return "day-haze";
		}

		return null;
	},

	/*
	Convert the direction into Degrees
	*/
	convertWindDirection(windDirection) {
		const windCardinals = {
			"N": 0,
			"NNE": 22,
			"NE": 45,
			"ENE": 67,
			"E": 90,
			"ESE": 112,
			"SE": 135,
			"SSE": 157,
			"S": 180,
			"SSW": 202,
			"SW": 225,
			"WSW": 247,
			"W": 270,
			"WNW": 292,
			"NW": 315,
			"NNW": 337
		};

		return windCardinals.hasOwnProperty(windDirection) ? windCardinals[windDirection] : null;
	}
});
