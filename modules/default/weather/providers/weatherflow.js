/* global WeatherProvider, WeatherObject, WeatherUtils */

/*
 * This class is a provider for Weatherflow.
 * Note that the Weatherflow API does not provide snowfall.
 */
WeatherProvider.register("weatherflow", {

	/*
	 * Set the name of the provider.
	 * Not strictly required, but helps for debugging
	 */
	providerName: "WeatherFlow",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiBase: "https://swd.weatherflow.com/swd/rest/",
		token: "",
		stationid: ""
	},

	fetchCurrentWeather () {
		this.fetchData(this.getUrl())
			.then((data) => {
				const currentWeather = new WeatherObject();
				currentWeather.date = moment();

				currentWeather.humidity = data.current_conditions.relative_humidity;
				currentWeather.temperature = data.current_conditions.air_temperature;
				currentWeather.windSpeed = WeatherUtils.convertWindToMs(data.current_conditions.wind_avg);
				currentWeather.windFromDirection = data.current_conditions.wind_direction;
				currentWeather.weatherType = data.forecast.daily[0].icon;
				currentWeather.sunrise = moment.unix(data.forecast.daily[0].sunrise);
				currentWeather.sunset = moment.unix(data.forecast.daily[0].sunset);
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
				const days = [];

				for (const forecast of data.forecast.daily) {
					const weather = new WeatherObject();

					weather.date = moment.unix(forecast.day_start_local);
					weather.minTemperature = forecast.air_temp_low;
					weather.maxTemperature = forecast.air_temp_high;
					weather.precipitationProbability = forecast.precip_probability;
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
	getUrl () {
		return `${this.config.apiBase}better_forecast?station_id=${this.config.stationid}&units_temp=c&units_wind=kph&units_pressure=mb&units_precip=mm&units_distance=km&token=${this.config.token}`;
	}
});
