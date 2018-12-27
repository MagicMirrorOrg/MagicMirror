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

	fetchCurrentWeather: function() {
		this.fetchData(this.getUrl())
			.then(data => {
				Log.log(data);
				if(!data || !data.currently || typeof data.currently.temperature === "undefined") {
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
		this.fetchData(this.getUrl())
			.then(data => {
				Log.log(data);
				if(!data || !data.daily || !data.daily.data.length) {
					// No usable data?
					return;
				}
				var forecast = this.generateWeatherObjectsFromForecast(data.daily.data);
				this.setWeatherForecast(forecast);
			}).catch(function(request) {
				Log.error("Could not load data!", request);
			});
	},

	// Create a URL from the config and base URL.
	getUrl: function() {
		return `https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/${this.config.apiKey}/${this.config.lat},${this.config.lon}`;
	},

	// Implement WeatherDay generator.
	generateWeatherDayFromCurrentWeather: function(currentWeatherData) {
		var currentWeather = new WeatherObject();

		currentWeather.date = moment();
		currentWeather.humidity = parseFloat(currentWeatherData.currently.humidity);
		currentWeather.temperature = parseFloat(currentWeatherData.currently.temperature);
		currentWeather.windSpeed = parseFloat(currentWeatherData.currently.windSpeed);
		currentWeather.windDirection = currentWeatherData.currently.windBearing;
		currentWeather.weatherType = this.convertWeatherType(currentWeatherData.currently.icon);
		currentWeather.sunrise = moment(currentWeatherData.daily.data[0].sunriseTime, "X");
		currentWeather.sunset = moment(currentWeatherData.daily.data[0].sunsetTime, "X");

		return currentWeather;
	},

	generateWeatherObjectsFromForecast: function(forecasts) {
		var days = [];

		for (var forecast of forecasts) {
			var weather = new WeatherObject();

			weather.date = moment(forecast.time, "X");
			weather.minTemperature = forecast.temperatureMin;
			weather.maxTemperature = forecast.temperatureMax;
			weather.weatherType = this.convertWeatherType(forecast.icon);
			weather.rain = forecast.precipAccumulation;

			days.push(weather)
		}

		return days
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