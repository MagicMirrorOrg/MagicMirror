/* global WeatherProvider, WeatherObject */

/* MagicMirror²
 * Module: Weather
 * Provider: Weatherflow
 *
 * By Tobias Dreyem https://github.com/10bias
 * MIT Licensed
 *
 * This class is a provider for Weatherflow.
 * Note that the Weatherflow API does not provide snowfall.
 */

WeatherProvider.register("weatherflow", {
	// Set the name of the provider.
	// Not strictly required, but helps for debugging
	providerName: "WeatherFlow",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiBase: "https://swd.weatherflow.com/swd/rest/",
		token: "",
		stationid: ""
	},

	units: {
		imperial: {
			temp: "f",
			wind: "mph",
			pressure: "hpa",
			precip: "in",
			distance: "mi"
		},
		metric: {
			temp: "c",
			wind: "kph",
			pressure: "mb",
			precip: "mm",
			distance: "km"
		}
	},

	fetchCurrentWeather() {
		this.fetchData(this.getUrl())
			.then((data) => {
				const currentWeather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);
				currentWeather.date = moment();

				currentWeather.humidity = data.current_conditions.relative_humidity;
				currentWeather.temperature = data.current_conditions.air_temperature;
				currentWeather.windSpeed = data.current_conditions.wind_avg;
				currentWeather.windDirection = data.current_conditions.wind_direction;
				currentWeather.weatherType = data.forecast.daily[0].icon;
				currentWeather.sunrise = moment(data.forecast.daily[0].sunrise, "X");
				currentWeather.sunset = moment(data.forecast.daily[0].sunset, "X");
				this.setCurrentWeather(currentWeather);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	fetchWeatherForecast() {
		this.fetchData(this.getUrl())
			.then((data) => {
				const days = [];

				for (const forecast of data.forecast.daily) {
					const weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);

					weather.date = moment(forecast.day_start_local, "X");
					weather.minTemperature = forecast.air_temp_low;
					weather.maxTemperature = forecast.air_temp_high;
					weather.weatherType = forecast.icon;
					weather.snow = 0;

					days.push(weather);
				}

				this.setWeatherForecast(days);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	// Create a URL from the config and base URL.
	getUrl() {
		return (
			this.config.apiBase +
			"better_forecast?station_id=" +
			this.config.stationid +
			"&units_temp=" +
			this.units[this.config.units].temp +
			"&units_wind=" +
			this.units[this.config.units].wind +
			"&units_pressure=" +
			this.units[this.config.units].pressure +
			"&units_precip=" +
			this.units[this.config.units].precip +
			"&units_distance=" +
			this.units[this.config.units].distance +
			"&token=" +
			this.config.token
		);
	}
});
