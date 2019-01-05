/* global WeatherProvider, WeatherObject */

/* Magic Mirror
 * Module: Weather
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * This class is the blueprint for a weather provider.
 */

WeatherProvider.register("openweathermap", {

	// Set the name of the provider.
	// This isn't strictly necessary, since it will fallback to the provider identifier
	// But for debugging (and future alerts) it would be nice to have the real name.
	providerName: "OpenWeatherMap",

	// Overwrite the fetchCurrentWeather method.
	fetchCurrentWeather() {
		this.fetchData(this.getUrl())
			.then(data => {
				if (!data || !data.main || typeof data.main.temp === "undefined") {
					// Did not receive usable new data.
					// Maybe this needs a better check?
					return;
				}

				this.setFetchedLocation(`${data.name}, ${data.sys.country}`);

				const currentWeather = this.generateWeatherObjectFromCurrentWeather(data);
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
				if (!data || !data.list || !data.list.length) {
					// Did not receive usable new data.
					// Maybe this needs a better check?
					return;
				}

				this.setFetchedLocation(`${data.city.name}, ${data.city.country}`);

				const forecast = this.generateWeatherObjectsFromForecast(data.list);
				this.setWeatherForecast(forecast);
			})
			.catch(function(request) {
				Log.error("Could not load data ... ", request);
			})
	},



	/** OpenWeatherMap Specific Methods - These are not part of the default provider methods */
	/*
	 * Gets the complete url for the request
	 */
	getUrl() {
		return this.config.apiBase + this.config.apiVersion + this.config.weatherEndpoint + this.getParams();
	},

	/* 
	 * Generate a WeatherObject based on currentWeatherInformation
	 */
	generateWeatherObjectFromCurrentWeather(currentWeatherData) {
		const currentWeather = new WeatherObject(this.config.units);

		currentWeather.humidity = currentWeatherData.main.humidity;
		currentWeather.temperature = currentWeatherData.main.temp;
		currentWeather.windSpeed = currentWeatherData.wind.speed;
		currentWeather.windDirection = currentWeatherData.wind.deg;
		currentWeather.weatherType = this.convertWeatherType(currentWeatherData.weather[0].icon);
		currentWeather.sunrise = moment(currentWeatherData.sys.sunrise, "X");
		currentWeather.sunset = moment(currentWeatherData.sys.sunset, "X");

		return currentWeather;
	},

	/*
	 * Generate WeatherObjects based on forecast information
	 */
	generateWeatherObjectsFromForecast(forecasts) {
		// initial variable declaration
		const days = [];
		// variables for temperature range and rain
		var minTemp = [];
		var maxTemp = [];
		var rain = 0;
		// variable for date
		let date = "";
		var weather = new WeatherObject(this.config.units);

		for (const forecast of forecasts) {
			
			if (date === moment(forecast.dt, "X").format("YYYY-MM-DD")) {
				// the same day as before
				// add values from forecast to corresponding variables
				minTemp.push(forecast.main.temp_min);
				maxTemp.push(forecast.main.temp_max);
				if (this.config.units === "imperial" && !isNaN(forecast.rain["3h"])) {
					rain += forecast.rain["3h"] / 25.4;
				} else {
					rain += forecast.rain["3h"];
				}
			} else {
				// a new day
				// calculate minimum/maximum temperature, specify rain amount
				weather.minTemperature = Math.min.apply(null, minTemp);
				weather.maxTemperature = Math.max.apply(null, maxTemp);
				weather.rain = rain;
				// push weather information to days array
				days.push(weather);
				// create new weather-object
				weather = new WeatherObject(this.config.units);
				
				minTemp = [];
				maxTemp = [];
				rain *= 0;
				
				// set new date
				date = moment(forecast.dt, "X").format("YYYY-MM-DD");
				
				// specify date
				weather.date = moment(forecast.dt, "X");
				
				// select weather type by first forecast value of a day, is this reasonable?
				weather.weatherType = this.convertWeatherType(forecast.weather[0].icon);
				
				// add values from first forecast of this day to corresponding variables
				minTemp.push(forecast.main.temp_min);
				maxTemp.push(forecast.main.temp_max);
				if (this.config.units === "imperial" && !isNaN(forecast.rain["3h"])) {
					rain += forecast.rain["3h"] / 25.4;
				} else {
					rain += forecast.rain["3h"];
				}
			}
		}
		
		return days.slice(1);
	},

	/*
	 * Convert the OpenWeatherMap icons to a more usable name.
	 */
	convertWeatherType(weatherType) {
		const weatherTypes = {
			"01d": "day-sunny",
			"02d": "day-cloudy",
			"03d": "cloudy",
			"04d": "cloudy-windy",
			"09d": "showers",
			"10d": "rain",
			"11d": "thunderstorm",
			"13d": "snow",
			"50d": "fog",
			"01n": "night-clear",
			"02n": "night-cloudy",
			"03n": "night-cloudy",
			"04n": "night-cloudy",
			"09n": "night-showers",
			"10n": "night-rain",
			"11n": "night-thunderstorm",
			"13n": "night-snow",
			"50n": "night-alt-cloudy-windy"
		};

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	},

	/* getParams(compliments)
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams() {
		let params = "?";
		if(this.config.locationID) {
			params += "id=" + this.config.locationID;
		} else if(this.config.location) {
			params += "q=" + this.config.location;
		} else if (this.firstEvent && this.firstEvent.geo) {
			params += "lat=" + this.firstEvent.geo.lat + "&lon=" + this.firstEvent.geo.lon;
		} else if (this.firstEvent && this.firstEvent.location) {
			params += "q=" + this.firstEvent.location;
		} else {
			this.hide(this.config.animationSpeed, {lockString:this.identifier});
			return;
		}

		params += "&units=" + this.config.units;
		params += "&lang=" + this.config.lang;
		params += "&APPID=" + this.config.apiKey;

		return params;
	}
});
