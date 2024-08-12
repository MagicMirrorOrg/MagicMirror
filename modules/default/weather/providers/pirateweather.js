/* global WeatherProvider, WeatherObject */

/*
 * This class is a provider for Pirate Weather, it is a replacement for Dark Sky (same api),
 * see http://pirateweather.net/en/latest/
 */
WeatherProvider.register("pirateweather", {

	/*
	 * Set the name of the provider.
	 * Not strictly required, but helps for debugging.
	 */
	providerName: "pirateweather",

	// Set the default config properties that is specific to this provider
	defaults: {
		useCorsProxy: true,
		apiBase: "https://api.pirateweather.net",
		weatherEndpoint: "/forecast",
		apiKey: "",
		lat: 0,
		lon: 0
	},

	fetchCurrentWeather () {
		this.fetchData(this.getUrl())
			.then((data) => {
				if (!data || !data.currently || typeof data.currently.temperature === "undefined") {
					// No usable data?
					return;
				}

				const currentWeather = this.generateWeatherDayFromCurrentWeather(data);
				this.setCurrentWeather(currentWeather);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	fetchWeatherForecast () {
		this.fetchData(this.getUrl())
			.then((data) => {
				if (!data || !data.daily || !data.daily.data.length) {
					// No usable data?
					return;
				}

				const forecast = this.generateWeatherObjectsFromForecast(data.daily.data);
				this.setWeatherForecast(forecast);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	// Create a URL from the config and base URL.
	getUrl () {
		return `${this.config.apiBase}${this.config.weatherEndpoint}/${this.config.apiKey}/${this.config.lat},${this.config.lon}?units=si&lang=${this.config.lang}`;
	},

	// Implement WeatherDay generator.
	generateWeatherDayFromCurrentWeather (currentWeatherData) {
		const currentWeather = new WeatherObject();

		currentWeather.date = moment();
		currentWeather.humidity = parseFloat(currentWeatherData.currently.humidity);
		currentWeather.temperature = parseFloat(currentWeatherData.currently.temperature);
		currentWeather.windSpeed = parseFloat(currentWeatherData.currently.windSpeed);
		currentWeather.windFromDirection = currentWeatherData.currently.windBearing;
		currentWeather.weatherType = this.convertWeatherType(currentWeatherData.currently.icon);
		currentWeather.sunrise = moment.unix(currentWeatherData.daily.data[0].sunriseTime);
		currentWeather.sunset = moment.unix(currentWeatherData.daily.data[0].sunsetTime);

		return currentWeather;
	},

	generateWeatherObjectsFromForecast (forecasts) {
		const days = [];

		for (const forecast of forecasts) {
			const weather = new WeatherObject();

			weather.date = moment.unix(forecast.time);
			weather.minTemperature = forecast.temperatureMin;
			weather.maxTemperature = forecast.temperatureMax;
			weather.weatherType = this.convertWeatherType(forecast.icon);
			weather.snow = 0;
			weather.rain = 0;

			let precip = 0;
			if (forecast.hasOwnProperty("precipAccumulation")) {
				precip = forecast.precipAccumulation * 10;
			}

			weather.precipitationAmount = precip;
			if (forecast.hasOwnProperty("precipType")) {
				if (forecast.precipType === "snow") {
					weather.snow = precip;
				} else {
					weather.rain = precip;
				}
			}

			days.push(weather);
		}

		return days;
	},

	// Map icons from Pirate Weather to our icons.
	convertWeatherType (weatherType) {
		const weatherTypes = {
			"clear-day": "day-sunny",
			"clear-night": "night-clear",
			rain: "rain",
			snow: "snow",
			sleet: "snow",
			wind: "wind",
			fog: "fog",
			cloudy: "cloudy",
			"partly-cloudy-day": "day-cloudy",
			"partly-cloudy-night": "night-cloudy"
		};

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	}
});
