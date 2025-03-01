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

				// Other available values: air_density, brightness, delta_t, dew_point,
				// pressure_trend (i.e. rising/falling), sea_level_pressure, wind gust, and more.

				currentWeather.humidity = data.current_conditions.relative_humidity;
				currentWeather.temperature = data.current_conditions.air_temperature;
				currentWeather.feelsLikeTemp = data.current_conditions.feels_like;
				currentWeather.windSpeed = WeatherUtils.convertWindToMs(data.current_conditions.wind_avg);
				currentWeather.windFromDirection = data.current_conditions.wind_direction;
				currentWeather.weatherType = this.convertWeatherType(data.current_conditions.icon);
				currentWeather.uv_index = data.current_conditions.uv;
				currentWeather.sunrise = moment.unix(data.forecast.daily[0].sunrise);
				currentWeather.sunset = moment.unix(data.forecast.daily[0].sunset);
				this.setCurrentWeather(currentWeather);
				this.fetchedLocationName = data.location_name;
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
					weather.weatherType = this.convertWeatherType(forecast.icon);

					// Must manually build UV and Precipitation from hourly
					weather.precipitationAmount = 0.0; // This will sum up rain and snow
					weather.precipitationUnits = "mm";
					weather.uv_index = 0;

					for (const hour of data.forecast.hourly) {
						const hour_time = moment.unix(hour.time);
						if (hour_time.day() === weather.date.day()) { // Iterate though until day is reached
							// Get data from today
							weather.uv_index = Math.max(weather.uv_index, hour.uv);
							weather.precipitationAmount += (hour.precip ?? 0);
						} else if (hour_time.diff(weather.date) >= 86400) {
							break; // No more data to be found
						}
					}
					days.push(weather);
				}
				this.setWeatherForecast(days);
				this.fetchedLocationName = data.location_name;
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	fetchWeatherHourly () {
		this.fetchData(this.getUrl())
			.then((data) => {
				const hours = [];
				for (const hour of data.forecast.hourly) {
					const weather = new WeatherObject();

					weather.date = moment.unix(hour.time);
					weather.temperature = hour.air_temperature;
					weather.feelsLikeTemp = hour.feels_like;
					weather.humidity = hour.relative_humidity;
					weather.windSpeed = hour.wind_avg;
					weather.windFromDirection = hour.wind_direction;
					weather.weatherType = this.convertWeatherType(hour.icon);
					weather.precipitationProbability = hour.precip_probability;
					weather.precipitationAmount = hour.precip; // NOTE: precipitation type is available
					weather.precipitationUnits = "mm"; // Hardcoded via request, TODO: Add conversion
					weather.uv_index = hour.uv;

					hours.push(weather);
					if (hours.length >= 48) break; // 10 days of hours are available, best to trim down.
				}
				this.setWeatherHourly(hours);
				this.fetchedLocationName = data.location_name;
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	convertWeatherType (weatherType) {
		const weatherTypes = {
			"clear-day": "day-sunny",
			"clear-night": "night-clear",
			cloudy: "cloudy",
			foggy: "fog",
			"partly-cloudy-day": "day-cloudy",
			"partly-cloudy-night": "night-alt-cloudy",
			"possibly-rainy-day": "day-rain",
			"possibly-rainy-night": "night-alt-rain",
			"possibly-sleet-day": "day-sleet",
			"possibly-sleet-night": "night-alt-sleet",
			"possibly-snow-day": "day-snow",
			"possibly-snow-night": "night-alt-snow",
			"possibly-thunderstorm-day": "day-thunderstorm",
			"possibly-thunderstorm-night": "night-alt-thunderstorm",
			rainy: "rain",
			sleet: "sleet",
			snow: "snow",
			thunderstorm: "thunderstorm",
			windy: "strong-wind"
		};

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	},

	// Create a URL from the config and base URL.
	getUrl () {
		return `${this.config.apiBase}better_forecast?station_id=${this.config.stationid}&units_temp=c&units_wind=kph&units_pressure=mb&units_precip=mm&units_distance=km&token=${this.config.token}`;
	}
});
