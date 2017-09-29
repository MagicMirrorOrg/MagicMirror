/* global WeatherProvider, WeatherDay */

/* Magic Mirror
 * Module: Weather
 * Provider: Dark Sky
 *
 * By Nicholas Hubbard https://github.com/nhubbard
 * MIT Licensed
 *
 * This class is a provider for Dark Sky.
 */
WeatherProvider.register("darksky", {
	// Set the name of the provider.
	// Not strictly required, but helps for debugging.
	providerName: "Dark Sky",
	// Implement fetchCurrentWeather.
	fetchCurrentWeather: function() {
		// Create a URL from the config and base URL.
		var url = `https://api.darksky.net/forecast/${this.config.apiKey}/${this.config.latLong}`;
		// Run the request.
		this.fetchData(url).then(data => {
			Log.log(data);
			if(!data || !data.main || typeof data.main.temp === "undefined") {
				// No usable data?
				return;
			}
			var currentWeather = this.generateWeatherDayFromCurrentWeather(data);
			this.setCurrentWeather(currentWeather);
		}).catch(function(request) {
			Log.error("Could not load data!", request);
		});
	},
	fetchWeatherForecast: function() {
		// Also, fake data.
		var forecast = [];
		var today = moment();
		for(var i = 0; i < 5; i++) {
			var weatherObject = new WeatherObject();
			weatherObject.date = moment(today).add(i, "days");
			weatherObject.minTemperature = Math.random() * 10 + 10;
			weatherObject.maxTemperature = Math.random() * 15 + 10;
			forecast.push(weatherObject);
		}
		this.setWeatherForecast();
	},
	// Implement WeatherDay generator.
	generateWeatherDayFromCurrentWeather: function(currentWeatherData) {
		var currentWeather = new WeatherObject();
		currentWeather.date = new Date();
		currentWeather.humidity = parseFloat(currentWeatherData.currently.humidity);
		currentWeather.temperature = parseFloat(currentWeatherData.currently.temperature);
		currentWeather.windSpeed = parseFloat(currentWeatherData.currently.windSpeed);
		currentWeather.windDirection = currentWeatherData.currently.windBearing;
		currentWeather.weatherType = this.currentWeatherType(currentWeatherData.currently.icon);
		currentWeather.sunrise = new Date(currentWeatherData.daily.data[0].sunriseTime);
		currentWeather.sunset = new Date(currentWeatherData.daily.data[0].sunsetTime);
		return currentWeather;
	},
	// Map icons from Dark Sky to our icons.
	convertWeatherType: function(weatherType) {
		var weatherTypes = {
			"clear-day": "day-sunny",
			"clear-night": "night-clear",
			"rain": "rain",
			"snow": "snow",
			"sleet": "snow",
			"wind": "wind",
			"fog": "fog",
			"cloudy": "cloudy",
			"partly-cloudy-day": "day-cloudy",
			"partly-cloudy-night": "night-cloudy"
		};
		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	}
});