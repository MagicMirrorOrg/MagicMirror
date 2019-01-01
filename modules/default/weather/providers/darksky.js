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

	units: {
		imperial: 'us',
		metric: 'si'
	},

	fetchCurrentWeather() {
		this.fetchData(this.getUrl())
			.then(data => {
				if(!data || !data.currently || typeof data.currently.temperature === "undefined") {
					// No usable data?
					return;
				}

				const currentWeather = this.generateWeatherDayFromCurrentWeather(data);
				this.setCurrentWeather(currentWeather);
			}).catch(function(request) {
				Log.error("Could not load data ... ", request);
			});
	},

	fetchWeatherForecast() {
		this.fetchData(this.getUrl())
			.then(data => {
				if(!data || !data.daily || !data.daily.data.length) {
					// No usable data?
					return;
				}

				const forecast = this.generateWeatherObjectsFromForecast(data.daily.data);
				this.setWeatherForecast(forecast);
			}).catch(function(request) {
				Log.error("Could not load data ... ", request);
			});
	},

	// Create a URL from the config and base URL.
	getUrl() {
		const units = this.units[this.config.units] || "auto";
		return `${this.config.apiBase}${this.config.weatherEndpoint}/${this.config.apiKey}/${this.config.lat},${this.config.lon}?units=${units}&lang=${this.config.lang}`;
	},

	// Implement WeatherDay generator.
	generateWeatherDayFromCurrentWeather(currentWeatherData) {
		const currentWeather = new WeatherObject(this.config.units);

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

	generateWeatherObjectsFromForecast(forecasts) {
		const days = [];

		for (const forecast of forecasts) {
			const weather = new WeatherObject(this.config.units);

			weather.date = moment(forecast.time, "X");
			weather.minTemperature = forecast.temperatureMin;
			weather.maxTemperature = forecast.temperatureMax;
			weather.weatherType = this.convertWeatherType(forecast.icon);
			if (this.config.units === "metric" && !isNaN(forecast.precipAccumulation)) {
				weather.rain = forecast.precipAccumulation * 10;
			} else {
				weather.rain = forecast.precipAccumulation;
			}

			days.push(weather);
		}

		return days;
	},

	// Map icons from Dark Sky to our icons.
	convertWeatherType(weatherType) {
		const weatherTypes = {
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
