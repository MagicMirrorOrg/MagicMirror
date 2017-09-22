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
	// This isn't strictly nessecery, since it will fallback to the provider identifier
	// But for debugging (and future alerts) it would be nice to have the real name.
	providerName: "OpenWeatherMap",

	// Overwrite the fetchCurrentWeather method.
	fetchCurrentWeather: function() {
		var  apiVersion = "2.5"
		var  apiBase =  "http://api.openweathermap.org/data/"
		var  weatherEndpoint = "weather"

		var url = apiBase + apiVersion + "/" + weatherEndpoint + this.getParams()

		this.fetchData(url)
			.then(data => {
				Log.log(data)

				if (!data || !data.main || typeof data.main.temp === "undefined") {
					// Did not receive usable new data.
					// Maybe this needs a better check?
					return;
				}

				var currentWeather = this.generateWeatherObjectFromCurrentWeather(data)
				this.setCurrentWeather(currentWeather)
			})
			.catch(function(request) {
				Log.error("Could not load data ... ", request)
			})
	},


	/** OpenWeatherMap Specific Methods - These are not part of the default provider methods */


	/* 
	 * Generate a WeatherObject based on currentWeatherInformation
	 */
	generateWeatherObjectFromCurrentWeather: function(currentWeatherData) {
		var currentWeather = new WeatherObject()

		currentWeather.humidity = currentWeatherData.main.humidity ? parseFloat(currentWeatherData.main.humidity) : null
		currentWeather.temperature = currentWeatherData.main.temp ? parseFloat(currentWeatherData.main.temp) : null
		currentWeather.windSpeed = currentWeatherData.wind.speed ? parseFloat(currentWeatherData.wind.speed) : null
		currentWeather.windDirection = currentWeatherData.wind.deg ? currentWeatherData.wind.deg : null
		currentWeather.weatherType = currentWeatherData.weather[0].icon ? this.convertWeatherType(currentWeatherData.weather[0].icon) : null
		currentWeather.sunrise = currentWeatherData.sys.sunrise ? new Date(currentWeatherData.sys.sunrise * 1000) : null
		currentWeather.sunset = currentWeatherData.sys.sunset ? new Date(currentWeatherData.sys.sunset * 1000) : null

		return currentWeather
	},

	/*
	 * Convert the OpenWeatherMap icons to a more usable name.
	 */
	convertWeatherType: function(weatherType) {
		var weatherTypes = {
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
		}

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null
	},

	/* getParams(compliments)
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams: function() {
		var params = "?";
		if(this.config.locationID) {
			params += "id=" + this.config.locationID;
		} else if(this.config.location) {
			params += "q=" + this.config.location;
		} else if (this.firstEvent && this.firstEvent.geo) {
			params += "lat=" + this.firstEvent.geo.lat + "&lon=" + this.firstEvent.geo.lon
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
	},
});