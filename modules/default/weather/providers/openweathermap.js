/* global WeatherProvider, WeatherObject */

/*
 * This class is a provider for Openweathermap,
 * see https://openweathermap.org/
 */
WeatherProvider.register("openweathermap", {

	/*
	 * Set the name of the provider.
	 * This isn't strictly necessary, since it will fallback to the provider identifier
	 * But for debugging (and future alerts) it would be nice to have the real name.
	 */
	providerName: "OpenWeatherMap",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiVersion: "3.0",
		apiBase: "https://api.openweathermap.org/data/",
		// weatherEndpoint is "/onecall" since API 3.0
		// "/onecall", "/forecast" or "/weather" only for pro customers
		weatherEndpoint: "/onecall",
		locationID: false,
		location: false,
		// the /onecall endpoint needs lat / lon values, it doesn't support the locationId
		lat: 0,
		lon: 0,
		apiKey: ""
	},

	// Overwrite the fetchCurrentWeather method.
	fetchCurrentWeather () {
		this.fetchData(this.getUrl())
			.then((data) => {
				let currentWeather;
				if (this.config.weatherEndpoint === "/onecall") {
					currentWeather = this.generateWeatherObjectsFromOnecall(data).current;
					this.setFetchedLocation(`${data.timezone}`);
				} else {
					currentWeather = this.generateWeatherObjectFromCurrentWeather(data);
				}
				this.setCurrentWeather(currentWeather);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	// Overwrite the fetchWeatherForecast method.
	fetchWeatherForecast () {
		this.fetchData(this.getUrl())
			.then((data) => {
				let forecast;
				let location;
				if (this.config.weatherEndpoint === "/onecall") {
					forecast = this.generateWeatherObjectsFromOnecall(data).days;
					location = `${data.timezone}`;
				} else {
					forecast = this.generateWeatherObjectsFromForecast(data.list);
					location = `${data.city.name}, ${data.city.country}`;
				}
				this.setWeatherForecast(forecast);
				this.setFetchedLocation(location);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	// Overwrite the fetchWeatherHourly method.
	fetchWeatherHourly () {
		this.fetchData(this.getUrl())
			.then((data) => {
				if (!data) {

					/*
					 * Did not receive usable new data.
					 * Maybe this needs a better check?
					 */
					return;
				}

				this.setFetchedLocation(`(${data.lat},${data.lon})`);

				const weatherData = this.generateWeatherObjectsFromOnecall(data);
				this.setWeatherHourly(weatherData.hours);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	/** OpenWeatherMap Specific Methods - These are not part of the default provider methods */
	/*
	 * Gets the complete url for the request
	 */
	getUrl () {
		return this.config.apiBase + this.config.apiVersion + this.config.weatherEndpoint + this.getParams();
	},

	/*
	 * Generate a WeatherObject based on currentWeatherInformation
	 */
	generateWeatherObjectFromCurrentWeather (currentWeatherData) {
		const currentWeather = new WeatherObject();

		currentWeather.date = moment.unix(currentWeatherData.dt);
		currentWeather.humidity = currentWeatherData.main.humidity;
		currentWeather.temperature = currentWeatherData.main.temp;
		currentWeather.feelsLikeTemp = currentWeatherData.main.feels_like;
		currentWeather.windSpeed = currentWeatherData.wind.speed;
		currentWeather.windFromDirection = currentWeatherData.wind.deg;
		currentWeather.weatherType = this.convertWeatherType(currentWeatherData.weather[0].icon);
		currentWeather.sunrise = moment.unix(currentWeatherData.sys.sunrise);
		currentWeather.sunset = moment.unix(currentWeatherData.sys.sunset);

		return currentWeather;
	},

	/*
	 * Generate WeatherObjects based on forecast information
	 */
	generateWeatherObjectsFromForecast (forecasts) {
		if (this.config.weatherEndpoint === "/forecast") {
			return this.generateForecastHourly(forecasts);
		} else if (this.config.weatherEndpoint === "/forecast/daily") {
			return this.generateForecastDaily(forecasts);
		}
		// if weatherEndpoint does not match forecast or forecast/daily, what should be returned?
		return [new WeatherObject()];
	},

	/*
	 * Generate WeatherObjects based on One Call forecast information
	 */
	generateWeatherObjectsFromOnecall (data) {
		if (this.config.weatherEndpoint === "/onecall") {
			return this.fetchOnecall(data);
		}
		// if weatherEndpoint does not match onecall, what should be returned?
		return { current: new WeatherObject(), hours: [], days: [] };
	},

	/*
	 * Generate forecast information for 3-hourly forecast (available for free
	 * subscription).
	 */
	generateForecastHourly (forecasts) {
		// initial variable declaration
		const days = [];
		// variables for temperature range and rain
		let minTemp = [];
		let maxTemp = [];
		let rain = 0;
		let snow = 0;
		// variable for date
		let date = "";
		let weather = new WeatherObject();

		for (const forecast of forecasts) {
			if (date !== moment.unix(forecast.dt).format("YYYY-MM-DD")) {
				// calculate minimum/maximum temperature, specify rain amount
				weather.minTemperature = Math.min.apply(null, minTemp);
				weather.maxTemperature = Math.max.apply(null, maxTemp);
				weather.rain = rain;
				weather.snow = snow;
				weather.precipitationAmount = (weather.rain ?? 0) + (weather.snow ?? 0);
				// push weather information to days array
				days.push(weather);
				// create new weather-object
				weather = new WeatherObject();

				minTemp = [];
				maxTemp = [];
				rain = 0;
				snow = 0;

				// set new date
				date = moment.unix(forecast.dt).format("YYYY-MM-DD");

				// specify date
				weather.date = moment.unix(forecast.dt);

				// If the first value of today is later than 17:00, we have an icon at least!
				weather.weatherType = this.convertWeatherType(forecast.weather[0].icon);
			}

			if (moment.unix(forecast.dt).format("H") >= 8 && moment.unix(forecast.dt).format("H") <= 17) {
				weather.weatherType = this.convertWeatherType(forecast.weather[0].icon);
			}

			/*
			 * the same day as before
			 * add values from forecast to corresponding variables
			 */
			minTemp.push(forecast.main.temp_min);
			maxTemp.push(forecast.main.temp_max);

			if (forecast.hasOwnProperty("rain") && !isNaN(forecast.rain["3h"])) {
				rain += forecast.rain["3h"];
			}

			if (forecast.hasOwnProperty("snow") && !isNaN(forecast.snow["3h"])) {
				snow += forecast.snow["3h"];
			}
		}

		/*
		 * last day
		 * calculate minimum/maximum temperature, specify rain amount
		 */
		weather.minTemperature = Math.min.apply(null, minTemp);
		weather.maxTemperature = Math.max.apply(null, maxTemp);
		weather.rain = rain;
		weather.snow = snow;
		weather.precipitationAmount = (weather.rain ?? 0) + (weather.snow ?? 0);
		// push weather information to days array
		days.push(weather);
		return days.slice(1);
	},

	/*
	 * Generate forecast information for daily forecast (available for paid
	 * subscription or old apiKey).
	 */
	generateForecastDaily (forecasts) {
		// initial variable declaration
		const days = [];

		for (const forecast of forecasts) {
			const weather = new WeatherObject();

			weather.date = moment.unix(forecast.dt);
			weather.minTemperature = forecast.temp.min;
			weather.maxTemperature = forecast.temp.max;
			weather.weatherType = this.convertWeatherType(forecast.weather[0].icon);
			weather.rain = 0;
			weather.snow = 0;

			/*
			 * forecast.rain not available if amount is zero
			 * The API always returns in millimeters
			 */
			if (forecast.hasOwnProperty("rain") && !isNaN(forecast.rain)) {
				weather.rain = forecast.rain;
			}

			/*
			 * forecast.snow not available if amount is zero
			 * The API always returns in millimeters
			 */
			if (forecast.hasOwnProperty("snow") && !isNaN(forecast.snow)) {
				weather.snow = forecast.snow;
			}

			weather.precipitationAmount = weather.rain + weather.snow;
			weather.precipitationProbability = forecast.pop ? forecast.pop * 100 : undefined;

			days.push(weather);
		}

		return days;
	},

	/*
	 * Fetch One Call forecast information (available for free subscription).
	 * Factors in timezone offsets.
	 * Minutely forecasts are excluded for the moment, see getParams().
	 */
	fetchOnecall (data) {
		let precip = false;

		// get current weather, if requested
		const current = new WeatherObject();
		if (data.hasOwnProperty("current")) {
			current.date = moment.unix(data.current.dt).utcOffset(data.timezone_offset / 60);
			current.windSpeed = data.current.wind_speed;
			current.windFromDirection = data.current.wind_deg;
			current.sunrise = moment.unix(data.current.sunrise).utcOffset(data.timezone_offset / 60);
			current.sunset = moment.unix(data.current.sunset).utcOffset(data.timezone_offset / 60);
			current.temperature = data.current.temp;
			current.weatherType = this.convertWeatherType(data.current.weather[0].icon);
			current.humidity = data.current.humidity;
			current.uv_index = data.current.uvi;
			if (data.current.hasOwnProperty("rain") && !isNaN(data.current.rain["1h"])) {
				current.rain = data.current.rain["1h"];
				precip = true;
			}
			if (data.current.hasOwnProperty("snow") && !isNaN(data.current.snow["1h"])) {
				current.snow = data.current.snow["1h"];
				precip = true;
			}
			if (precip) {
				current.precipitationAmount = (current.rain ?? 0) + (current.snow ?? 0);
			}
			current.feelsLikeTemp = data.current.feels_like;
		}

		let weather = new WeatherObject();

		// get hourly weather, if requested
		const hours = [];
		if (data.hasOwnProperty("hourly")) {
			for (const hour of data.hourly) {
				weather.date = moment.unix(hour.dt).utcOffset(data.timezone_offset / 60);
				weather.temperature = hour.temp;
				weather.feelsLikeTemp = hour.feels_like;
				weather.humidity = hour.humidity;
				weather.windSpeed = hour.wind_speed;
				weather.windFromDirection = hour.wind_deg;
				weather.weatherType = this.convertWeatherType(hour.weather[0].icon);
				weather.precipitationProbability = hour.pop ? hour.pop * 100 : undefined;
				weather.uv_index = hour.uvi;
				precip = false;
				if (hour.hasOwnProperty("rain") && !isNaN(hour.rain["1h"])) {
					weather.rain = hour.rain["1h"];
					precip = true;
				}
				if (hour.hasOwnProperty("snow") && !isNaN(hour.snow["1h"])) {
					weather.snow = hour.snow["1h"];
					precip = true;
				}
				if (precip) {
					weather.precipitationAmount = (weather.rain ?? 0) + (weather.snow ?? 0);
				}

				hours.push(weather);
				weather = new WeatherObject();
			}
		}

		// get daily weather, if requested
		const days = [];
		if (data.hasOwnProperty("daily")) {
			for (const day of data.daily) {
				weather.date = moment.unix(day.dt).utcOffset(data.timezone_offset / 60);
				weather.sunrise = moment.unix(day.sunrise).utcOffset(data.timezone_offset / 60);
				weather.sunset = moment.unix(day.sunset).utcOffset(data.timezone_offset / 60);
				weather.minTemperature = day.temp.min;
				weather.maxTemperature = day.temp.max;
				weather.humidity = day.humidity;
				weather.windSpeed = day.wind_speed;
				weather.windFromDirection = day.wind_deg;
				weather.weatherType = this.convertWeatherType(day.weather[0].icon);
				weather.precipitationProbability = day.pop ? day.pop * 100 : undefined;
				weather.uv_index = day.uvi;
				precip = false;
				if (!isNaN(day.rain)) {
					weather.rain = day.rain;
					precip = true;
				}
				if (!isNaN(day.snow)) {
					weather.snow = day.snow;
					precip = true;
				}
				if (precip) {
					weather.precipitationAmount = (weather.rain ?? 0) + (weather.snow ?? 0);
				}

				days.push(weather);
				weather = new WeatherObject();
			}
		}

		return { current: current, hours: hours, days: days };
	},

	/*
	 * Convert the OpenWeatherMap icons to a more usable name.
	 */
	convertWeatherType (weatherType) {
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

	/*
	 * getParams(compliments)
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams () {
		let params = "?";
		if (this.config.weatherEndpoint === "/onecall") {
			params += `lat=${this.config.lat}`;
			params += `&lon=${this.config.lon}`;
			if (this.config.type === "current") {
				params += "&exclude=minutely,hourly,daily";
			} else if (this.config.type === "hourly") {
				params += "&exclude=current,minutely,daily";
			} else if (this.config.type === "daily" || this.config.type === "forecast") {
				params += "&exclude=current,minutely,hourly";
			} else {
				params += "&exclude=minutely";
			}
		} else if (this.config.lat && this.config.lon) {
			params += `lat=${this.config.lat}&lon=${this.config.lon}`;
		} else if (this.config.locationID) {
			params += `id=${this.config.locationID}`;
		} else if (this.config.location) {
			params += `q=${this.config.location}`;
		} else if (this.firstEvent && this.firstEvent.geo) {
			params += `lat=${this.firstEvent.geo.lat}&lon=${this.firstEvent.geo.lon}`;
		} else if (this.firstEvent && this.firstEvent.location) {
			params += `q=${this.firstEvent.location}`;
		} else {
			// TODO hide doesnt exist!
			this.hide(this.config.animationSpeed, { lockString: this.identifier });
			return;
		}

		params += "&units=metric"; // WeatherProviders should use metric internally and use the units only for when displaying data
		params += `&lang=${this.config.lang}`;
		params += `&APPID=${this.config.apiKey}`;

		return params;
	}
});
