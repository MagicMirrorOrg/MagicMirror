/* global WeatherProvider, WeatherObject */

/* Magic Mirror
 * Module: Weather
 * Provider: Weatherbit
 *
 * By Andrew Pometti
 * MIT Licensed
 *
 * This class is a provider for Weatherbit, based on Nicholas Hubbard's class for Dark Sky & Vince Peri's class for Weather.gov.
 */
WeatherProvider.register("weatherbit", {
	// Set the name of the provider.
	// Not strictly required, but helps for debugging.
	providerName: "Weatherbit",

	units: {
		imperial: "I",
		metric: "M"
	},

	fetchedLocation: function () {
		return this.fetchedLocationName || "";
	},

	fetchCurrentWeather() {
		this.fetchData(this.getUrl())
			.then((data) => {
				if (!data || !data.data[0] || typeof data.data[0].temp === "undefined") {
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

	fetchWeatherForecast() {
		this.fetchData(this.getUrl())
			.then((data) => {
				if (!data || !data.data) {
					// No usable data?
					return;
				}

				const forecast = this.generateWeatherObjectsFromForecast(data.data);
				this.setWeatherForecast(forecast);

				this.fetchedLocationName = data.city_name + ", " + data.state_code;
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	// Create a URL from the config and base URL.
	getUrl() {
		const units = this.units[this.config.units] || "auto";
		return `${this.config.apiBase}${this.config.weatherEndpoint}?lat=${this.config.lat}&lon=${this.config.lon}&units=${units}&key=${this.config.apiKey}`;
	},

	// Implement WeatherDay generator.
	generateWeatherDayFromCurrentWeather(currentWeatherData) {
		//Calculate TZ Offset and invert to convert Sunrise/Sunset times to Local
		const d = new Date();
		let tzOffset = d.getTimezoneOffset();
		tzOffset = tzOffset * -1;

		const currentWeather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits);

		currentWeather.date = moment(currentWeatherData.data[0].ts, "X");
		currentWeather.humidity = parseFloat(currentWeatherData.data[0].rh);
		currentWeather.temperature = parseFloat(currentWeatherData.data[0].temp);
		currentWeather.windSpeed = parseFloat(currentWeatherData.data[0].wind_spd);
		currentWeather.windDirection = currentWeatherData.data[0].wind_dir;
		currentWeather.weatherType = this.convertWeatherType(currentWeatherData.data[0].weather.icon);
		Log.log("Wx Icon: " + currentWeatherData.data[0].weather.icon);
		currentWeather.sunrise = moment(currentWeatherData.data[0].sunrise, "HH:mm").add(tzOffset, "m");
		currentWeather.sunset = moment(currentWeatherData.data[0].sunset, "HH:mm").add(tzOffset, "m");

		this.fetchedLocationName = currentWeatherData.data[0].city_name + ", " + currentWeatherData.data[0].state_code;

		return currentWeather;
	},

	generateWeatherObjectsFromForecast(forecasts) {
		const days = [];

		for (const forecast of forecasts) {
			const weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits);

			weather.date = moment(forecast.datetime, "YYYY-MM-DD");
			weather.minTemperature = forecast.min_temp;
			weather.maxTemperature = forecast.max_temp;
			weather.precipitation = forecast.precip;
			weather.weatherType = this.convertWeatherType(forecast.weather.icon);

			days.push(weather);
		}

		return days;
	},

	// Map icons from Dark Sky to our icons.
	convertWeatherType(weatherType) {
		const weatherTypes = {
			t01d: "day-thunderstorm",
			t01n: "night-alt-thunderstorm",
			t02d: "day-thunderstorm",
			t02n: "night-alt-thunderstorm",
			t03d: "thunderstorm",
			t03n: "thunderstorm",
			t04d: "day-thunderstorm",
			t04n: "night-alt-thunderstorm",
			t05d: "day-sleet-storm",
			t05n: "night-alt-sleet-storm",
			d01d: "day-sprinkle",
			d01n: "night-alt-sprinkle",
			d02d: "day-sprinkle",
			d02n: "night-alt-sprinkle",
			d03d: "day-shower",
			d03n: "night-alt-shower",
			r01d: "day-shower",
			r01n: "night-alt-shower",
			r02d: "day-rain",
			r02n: "night-alt-rain",
			r03d: "day-rain",
			r03n: "night-alt-rain",
			r04d: "day-sprinkle",
			r04n: "night-alt-sprinkle",
			r05d: "day-shower",
			r05n: "night-alt-shower",
			r06d: "day-shower",
			r06n: "night-alt-shower",
			f01d: "day-sleet",
			f01n: "night-alt-sleet",
			s01d: "day-snow",
			s01n: "night-alt-snow",
			s02d: "day-snow-wind",
			s02n: "night-alt-snow-wind",
			s03d: "snowflake-cold",
			s03n: "snowflake-cold",
			s04d: "day-rain-mix",
			s04n: "night-alt-rain-mix",
			s05d: "day-sleet",
			s05n: "night-alt-sleet",
			s06d: "day-snow",
			s06n: "night-alt-snow",
			a01d: "day-haze",
			a01n: "dust",
			a02d: "smoke",
			a02n: "smoke",
			a03d: "day-haze",
			a03n: "dust",
			a04d: "dust",
			a04n: "dust",
			a05d: "day-fog",
			a05n: "night-fog",
			a06d: "fog",
			a06n: "fog",
			c01d: "day-sunny",
			c01n: "night-clear",
			c02d: "day-sunny-overcast",
			c02n: "night-alt-partly-cloudy",
			c03d: "day-cloudy",
			c03n: "night-alt-cloudy",
			c04d: "cloudy",
			c04n: "cloudy",
			u00d: "rain-mix",
			u00n: "rain-mix"
		};

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	}
});
