/* global WeatherProvider, WeatherObject */

/* MagicMirror²
 * Module: Weather
 * Provider: Yr.no
 *
 * By Magnus Marthinsen
 * MIT Licensed
 *
 * This class is a provider for Yr.no, a norwegian sweather service.
 *
 * Terms of service: https://developer.yr.no/doc/TermsOfService/
 */
WeatherProvider.register("yr", {
	providerName: "Yr",

	// Set the default config properties that is specific to this provider
	defaults: {
		useCorsProxy: true,
		apiBase: "https://api.met.no/weatherapi",
		altitude: 0,
		currentForecastHours: 1 //1, 6 or 12
	},

	//Backup cache if local storage does not work
	cache: {
		weatherData: undefined,
		stellarData: {
			today: undefined,
			tomorrow: undefined
		}
	},

	fetchCurrentWeather() {
		this.getCurrentWeather()
			.then((currentWeather) => {
				this.setCurrentWeather(currentWeather);
				this.updateAvailable();
			})
			.catch((error) => {
				Log.error(error);
				throw new Error(error);
			});
	},

	async getCurrentWeather() {
		const getRequests = [this.getWeatherData(), this.getStellarData()];
		const [weatherData, stellarData] = await Promise.all(getRequests);
		if (!stellarData) {
			Log.warn("No stelar data available.");
		}
		if (!weatherData.properties.timeseries || !weatherData.properties.timeseries[0]) {
			Log.error("No weather data available.");
			return;
		}
		const currentTime = moment();
		let forecast = weatherData.properties.timeseries[0];
		let closestTimeInPast = currentTime.diff(moment(forecast.time));
		for (const forecastTime of weatherData.properties.timeseries) {
			const comparison = currentTime.diff(moment(forecastTime.time));
			if (0 < comparison && comparison < closestTimeInPast) {
				closestTimeInPast = comparison;
				forecast = forecastTime;
			}
		}
		const forecastXHours = this.getForecastForXHoursFrom(forecast.data);
		forecast.weatherType = this.convertWeatherType(forecastXHours.summary.symbol_code, forecast.time);
		forecast.precipitation = forecastXHours.details?.precipitation_amount;
		forecast.minTemperature = forecastXHours.details?.precipitation_amount_min;
		forecast.maxTemperature = forecastXHours.details?.precipitation_amount_max;
		return this.getWeatherDataFrom(forecast, stellarData, weatherData.properties.meta.units);
	},

	getWeatherData() {
		return new Promise((resolve, reject) => {
			this.weatherDataQueue.push({ resolve, reject });
			this.getWeatherDataSynchrounous();
		});
	},

	weatherDataQueue: [],
	waitingForWeatherData: false,
	// Must be fetched synchrounously to give web request time to populate cache and avoid duplicate calls to the API
	getWeatherDataSynchrounous() {
		if (this.weatherDataQueue.length < 1) {
			return;
		}
		if (!this.waitingForWeatherData) {
			this.waitingForWeatherData = true;
			let { resolve, reject } = this.weatherDataQueue.shift();

			let weatherData = this.getWeatherDataFromCache();
			if (this.weatherDataIsValid(weatherData)) {
				this.waitingForWeatherData = false;
				this.getWeatherDataSynchrounous();
				Log.debug("Weather data found in cache.");
				resolve(weatherData);
			} else {
				this.getWeatherDataFromYr(weatherData?.downloadedAt)
					.then((weatherData) => {
						Log.debug("Got weather data from yr.");
						if (weatherData) {
							this.cacheWeatherData(weatherData);
						} else {
							//Undefined if unchanged
							weatherData = this.getWeatherDataFromCache();
						}
						resolve(weatherData);
					})
					.catch((err) => {
						Log.error(err);
						reject("Unable to get weather data from Yr.");
					})
					.finally(() => {
						this.waitingForWeatherData = false;
						this.getWeatherDataSynchrounous();
					});
			}
		}
	},

	weatherDataIsValid(weatherData) {
		return (
			weatherData &&
			weatherData.timeout &&
			0 < moment(weatherData.timeout).diff(moment()) &&
			(!weatherData.geometry || !weatherData.geometry.coordinates || !weatherData.geometry.coordinates.length < 2 || (weatherData.geometry.coordinates[0] === this.config.lat && weatherData.geometry.coordinates[1] === this.config.lon))
		);
	},

	getWeatherDataFromCache() {
		let weatherData = undefined;
		if (typeof Storage !== "undefined") {
			weatherData = localStorage.getItem("weatherData");
			if (weatherData) {
				return JSON.parse(weatherData);
			} else {
				return undefined;
			}
		} else {
			//local storage unavailable
			return this.cache?.weatherData;
		}
	},

	getWeatherDataFromYr(currentDataFetchedAt) {
		const requestHeaders = [{ name: "Accept", value: "application/json" }];
		if (currentDataFetchedAt) {
			requestHeaders.push({ name: "If-Modified-Since", value: currentDataFetchedAt });
		}

		const expectedResponseHeaders = ["expires", "date"];

		return this.fetchData(this.getForecastUrl(), "json", requestHeaders, expectedResponseHeaders)
			.then((data) => {
				if (!data || !data.headers) return data;
				data.timeout = data.headers.find((header) => header.name === "expires").value;
				data.downloadedAt = data.headers.find((header) => header.name === "date").value;
				data.headers = undefined;
				return data;
			})
			.catch((err) => {
				Log.error("Could not load weather data.", err);
				throw new Error(err);
			});
	},

	getForecastUrl() {
		if (!this.config.lat) {
			Log.error("Latitude not provided.");
			throw new Error("Latitude not provided.");
		}
		if (!this.config.lon) {
			Log.error("Longitude not provided.");
			throw new Error("Longitude not provided.");
		}

		const lat = this.config.lat.toString();
		const lon = this.config.lon.toString();
		const altitude = this.config.altitude ?? 0;

		if (lat.includes(".") && lat.split(".")[1].length > 4) {
			Log.error("Latitude is too specific. Do not use more than four decimals.");
			throw new Error("Latitude too specific.");
		}
		if (lon.includes(".") && lon.split(".")[1].length > 4) {
			Log.error("Longitude is too specific. Do not use more than four decimals.");
			throw new Error("Longitude too specific.");
		}

		return `${this.config.apiBase}/locationforecast/2.0/complete?&altitude=${altitude}&lat=${lat}&lon=${lon}`;
	},

	cacheWeatherData(weatherData) {
		if (typeof Storage !== "undefined") {
			//local storage available
			localStorage.setItem("weatherData", JSON.stringify(weatherData));
		} else {
			//local storage unavailable
			this.cache.weatherData = weatherData;
		}
	},

	getAuthenticationString() {
		if (!this.config.authenticationEmail) throw new Error("Authentication email not provided.");
		return `${this.config.applicaitionName} ${this.config.authenticationEmail}`;
	},

	getStellarData() {
		return new Promise((resolve, reject) => {
			this.stellarDataQueue.push({ resolve, reject });
			this.getStellarDataSynchrounous();
		});
	},

	stellarDataQueue: [],
	waitingForStellarData: false,
	// Must be fetched synchrounously to give web request time to populate cache and avoid duplicate calls to the API.
	getStellarDataSynchrounous() {
		if (this.stellarDataQueue.length < 1) {
			return;
		}
		if (!this.waitingForStellarData) {
			this.waitingForStellarData = true;
			let { resolve, reject } = this.stellarDataQueue.shift();

			let stellarData = this.getStellarDataFromCache();
			const today = moment().format("YYYY-MM-DD");
			const tomorrow = moment().add(1, "days").format("YYYY-MM-DD");
			if (stellarData && stellarData.today && stellarData.today.date === today && stellarData.tomorrow && stellarData.tomorrow.date === tomorrow && this.coordinatesAreCorrect(stellarData.today, stellarData.tomorrow)) {
				Log.debug("Stellar data found in cache.");
				this.waitingForStellarData = false;
				this.getStellarDataSynchrounous();
				resolve(stellarData);
			} else if (stellarData && stellarData.tomorrow && stellarData.tomorrow.date === today && this.coordinatesAreCorrect(stellarData.tomorrow)) {
				Log.debug("stellar data for today found in cache, but not for tomorrow.");
				stellarData.today = stellarData.tomorrow;
				this.getStellarDataFromYr(tomorrow)
					.then((data) => {
						if (data) {
							data.date = tomorrow;
							stellarData.tomorrow = data;
							this.cacheStellarData(stellarData);
							resolve(stellarData);
						} else {
							reject("No stellar data returned from Yr for " + tomorrow);
						}
					})
					.catch((err) => {
						Log.error(err);
						reject("Unable to get stellar data from Yr for " + tomorrow);
					})
					.finally(() => {
						this.waitingForStellarData = false;
						this.getStellarDataSynchrounous();
					});
			} else {
				this.getStellarDataFromYr(today, 2)
					.then((stellarData) => {
						if (stellarData) {
							stellarData = {
								today: stellarData
							};
							stellarData.tomorrow = Object.assign({}, stellarData.today);
							stellarData.today.date = today;
							stellarData.tomorrow.date = tomorrow;
							this.cacheStellarData(stellarData);
							resolve(stellarData);
						} else {
							Log.error("Something went wrong when fetching stellar data. Responses: " + stellarData);
							reject(stellarData);
						}
					})
					.catch((err) => {
						Log.error(err);
						reject("Unable to get stellar data from Yr.");
					})
					.finally(() => {
						this.waitingForStellarData = false;
						this.getStellarDataSynchrounous();
					});
			}
		}
	},

	coordinatesAreCorrect(todayData, tomorrowData) {
		if (tomorrowData)
			return (
				!todayData.location ||
				(Math.abs(parseFloat(this.config.lat) - parseFloat(todayData.location.latitude)) < 0.1 &&
					Math.abs(parseFloat(this.config.lon) - parseFloat(todayData.location.longitude)) < 0.1 &&
					(!tomorrowData.location || (Math.abs(parseFloat(this.config.lat) - parseFloat(tomorrowData.location.latitude)) < 0.1 && Math.abs(parseFloat(this.config.lon) - parseFloat(tomorrowData.location.longitude)) < 0.1)))
			);
		return !todayData.location || (Math.abs(parseFloat(this.config.lat) - parseFloat(todayData.location.latitude)) < 0.1 && Math.abs(parseFloat(this.config.lon) - parseFloat(todayData.location.longitude)) < 0.1);
	},

	getStellarDataFromCache() {
		let stellarData = undefined;
		if (typeof Storage !== "undefined") {
			stellarData = localStorage.getItem("stellarData");
			if (stellarData) {
				return JSON.parse(stellarData);
			} else {
				return undefined;
			}
		} else {
			//local storage unavailable
			return this.cache?.stellarData;
		}
	},

	getStellarDataFromYr(date, days = 1) {
		const requestHeaders = [{ name: "Accept", value: "application/json" }];
		return this.fetchData(this.getStellarDatatUrl(date, days), "json", requestHeaders)
			.then((data) => {
				Log.debug("Got stellar data from yr.");
				return data;
			})
			.catch((err) => {
				Log.error("Could not load weather data.", err);
				throw new Error(err);
			});
	},

	getStellarDatatUrl(date, days) {
		if (!this.config.lat) {
			Log.error("Latitude not provided.");
			throw new Error("Latitude not provided.");
		}
		if (!this.config.lon) {
			Log.error("Longitude not provided.");
			throw new Error("Longitude not provided.");
		}

		const lat = this.config.lat.toString();
		const lon = this.config.lon.toString();
		const altitude = this.config.altitude ?? 0;

		if (lat.includes(".") && lat.split(".")[1].length > 4) {
			Log.error("Latitude is too specific. Do not use more than four decimals.");
			throw new Error("Latitude too specific.");
		}
		if (lon.includes(".") && lon.split(".")[1].length > 4) {
			Log.error("Longitude is too specific. Do not use more than four decimals.");
			throw new Error("Longitude too specific.");
		}

		let utcOffset = moment().utcOffset() / 60;
		let utcOffsetPrefix = "%2B";
		if (utcOffset < 0) {
			utcOffsetPrefix = "-";
		}
		utcOffset = Math.abs(utcOffset);
		let minutes = "00";
		if (utcOffset % 1 !== 0) {
			minutes = "30";
		}
		let hours = Math.floor(utcOffset).toString();
		if (hours.length < 2) {
			hours = `0${hours}`;
		}

		return `${this.config.apiBase}/sunrise/2.0/.json?date=${date}&days=${days}&height=${altitude}&lat=${lat}&lon=${lon}&offset=${utcOffsetPrefix}${hours}%3A${minutes}`;
	},

	cacheStellarData(data) {
		if (typeof Storage !== "undefined") {
			//local storage available
			localStorage.setItem("stellarData", JSON.stringify(data));
		} else {
			//local storage unavailable
			this.cache.stellarData = data;
		}
	},

	getWeatherDataFrom(forecast, stellarData, units) {
		const weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);
		const stellarTimesToday = stellarData?.today ? this.getStellarTimesFrom(stellarData.today, moment().format("YYYY-MM-DD")) : undefined;
		const stellarTimesTomorrow = stellarData?.tomorrow ? this.getStellarTimesFrom(stellarData.tomorrow, moment().add(1, "days").format("YYYY-MM-DD")) : undefined;

		weather.date = moment(forecast.time);
		weather.windSpeed = forecast.data.instant.details.wind_speed;
		weather.windDirection = (forecast.data.instant.details.wind_from_direction + 180) % 360;
		weather.temperature = forecast.data.instant.details.air_temperature;
		weather.minTemperature = forecast.minTemperature;
		weather.maxTemperature = forecast.maxTemperature;
		weather.weatherType = forecast.weatherType;
		weather.humidity = forecast.data.instant.details.relative_humidity;
		weather.precipitation = forecast.precipitation;
		weather.precipitationUnits = units.precipitation_amount;

		if (stellarTimesToday) {
			weather.sunset = moment(stellarTimesToday.sunset.time);
			weather.sunrise = weather.sunset < moment() && stellarTimesTomorrow ? moment(stellarTimesTomorrow.sunrise.time) : moment(stellarTimesToday.sunrise.time);
		}

		return weather;
	},

	convertWeatherType(weatherType, weatherTime) {
		const weatherHour = moment(weatherTime).format("HH");

		const weatherTypes = {
			clearsky_day: "day-sunny",
			clearsky_night: "night-clear",
			clearsky_polartwilight: weatherHour < 14 ? "sunrise" : "sunset",
			cloudy: "cloudy",
			fair_day: "day-sunny-overcast",
			fair_night: "night-alt-partly-cloudy",
			fair_polartwilight: "day-sunny-overcast",
			fog: "fog",
			heavyrain: "rain", // Possibly raindrops or raindrop
			heavyrainandthunder: "thunderstorm",
			heavyrainshowers_day: "day-rain",
			heavyrainshowers_night: "night-alt-rain",
			heavyrainshowers_polartwilight: "day-rain",
			heavyrainshowersandthunder_day: "day-thunderstorm",
			heavyrainshowersandthunder_night: "night-alt-thunderstorm",
			heavyrainshowersandthunder_polartwilight: "day-thunderstorm",
			heavysleet: "sleet",
			heavysleetandthunder: "day-sleet-storm",
			heavysleetshowers_day: "day-sleet",
			heavysleetshowers_night: "night-alt-sleet",
			heavysleetshowers_polartwilight: "day-sleet",
			heavysleetshowersandthunder_day: "day-sleet-storm",
			heavysleetshowersandthunder_night: "night-alt-sleet-storm",
			heavysleetshowersandthunder_polartwilight: "day-sleet-storm",
			heavysnow: "snow-wind",
			heavysnowandthunder: "day-snow-thunderstorm",
			heavysnowshowers_day: "day-snow-wind",
			heavysnowshowers_night: "night-alt-snow-wind",
			heavysnowshowers_polartwilight: "day-snow-wind",
			heavysnowshowersandthunder_day: "day-snow-thunderstorm",
			heavysnowshowersandthunder_night: "night-alt-snow-thunderstorm",
			heavysnowshowersandthunder_polartwilight: "day-snow-thunderstorm",
			lightrain: "rain-mix",
			lightrainandthunder: "thunderstorm",
			lightrainshowers_day: "day-rain-mix",
			lightrainshowers_night: "night-alt-rain-mix",
			lightrainshowers_polartwilight: "day-rain-mix",
			lightrainshowersandthunder_day: "thunderstorm",
			lightrainshowersandthunder_night: "thunderstorm",
			lightrainshowersandthunder_polartwilight: "thunderstorm",
			lightsleet: "day-sleet",
			lightsleetandthunder: "day-sleet-storm",
			lightsleetshowers_day: "day-sleet",
			lightsleetshowers_night: "night-alt-sleet",
			lightsleetshowers_polartwilight: "day-sleet",
			lightsnow: "snowflake-cold",
			lightsnowandthunder: "day-snow-thunderstorm",
			lightsnowshowers_day: "day-snow-wind",
			lightsnowshowers_night: "night-alt-snow-wind",
			lightsnowshowers_polartwilight: "day-snow-wind",
			lightssleetshowersandthunder_day: "day-sleet-storm",
			lightssleetshowersandthunder_night: "night-alt-sleet-storm",
			lightssleetshowersandthunder_polartwilight: "day-sleet-storm",
			lightssnowshowersandthunder_day: "day-snow-thunderstorm",
			lightssnowshowersandthunder_night: "night-alt-snow-thunderstorm",
			lightssnowshowersandthunder_polartwilight: "day-snow-thunderstorm",
			partlycloudy_day: "day-cloudy",
			partlycloudy_night: "night-alt-cloudy",
			partlycloudy_polartwilight: "day-cloudy",
			rain: "rain",
			rainandthunder: "thunderstorm",
			rainshowers_day: "day-rain",
			rainshowers_night: "night-alt-rain",
			rainshowers_polartwilight: "day-rain",
			rainshowersandthunder_day: "thunderstorm",
			rainshowersandthunder_night: "lightning",
			rainshowersandthunder_polartwilight: "thunderstorm",
			sleet: "sleet",
			sleetandthunder: "day-sleet-storm",
			sleetshowers_day: "day-sleet",
			sleetshowers_night: "night-alt-sleet",
			sleetshowers_polartwilight: "day-sleet",
			sleetshowersandthunder_day: "day-sleet-storm",
			sleetshowersandthunder_night: "night-alt-sleet-storm",
			sleetshowersandthunder_polartwilight: "day-sleet-storm",
			snow: "snowflake-cold",
			snowandthunder: "lightning",
			snowshowers_day: "day-snow-wind",
			snowshowers_night: "night-alt-snow-wind",
			snowshowers_polartwilight: "day-snow-wind",
			snowshowersandthunder_day: "day-snow-thunderstorm",
			snowshowersandthunder_night: "night-alt-snow-thunderstorm",
			snowshowersandthunder_polartwilight: "day-snow-thunderstorm"
		};

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	},

	getStellarTimesFrom(stellarData, date) {
		for (const time of stellarData.location.time) {
			if (time.date === date) {
				return time;
			}
		}
		return undefined;
	},

	getForecastForXHoursFrom(weather) {
		if (this.config.currentForecastHours === 1) {
			if (weather.next_1_hours) {
				return weather.next_1_hours;
			} else if (weather.next_6_hours) {
				return weather.next_6_hours;
			} else {
				return weather.next_12_hours;
			}
		} else if (this.config.currentForecastHours === 6) {
			if (weather.next_6_hours) {
				return weather.next_6_hours;
			} else if (weather.next_12_hours) {
				return weather.next_12_hours;
			} else {
				return weather.next_1_hours;
			}
		} else {
			if (weather.next_12_hours) {
				return weather.next_12_hours;
			} else if (weather.next_6_hours) {
				return weather.next_6_hours;
			} else {
				return weather.next_1_hours;
			}
		}
	},

	fetchWeatherHourly() {
		this.getWeatherForecast("hourly")
			.then((forecast) => {
				this.setWeatherHourly(forecast);
				this.updateAvailable();
			})
			.catch((error) => {
				Log.error(error);
				throw new Error(error);
			});
	},

	async getWeatherForecast(type) {
		const getRequests = [this.getWeatherData(), this.getStellarData()];
		const [weatherData, stellarData] = await Promise.all(getRequests);
		if (!weatherData.properties.timeseries || !weatherData.properties.timeseries[0]) {
			Log.error("No weather data available.");
			return;
		}
		if (!stellarData) {
			Log.warn("No stelar data available.");
		}
		let forecasts;
		switch (type) {
			case "hourly":
				forecasts = this.getHourlyForecastFrom(weatherData);
				break;
			case "daily":
			default:
				forecasts = this.getDailyForecastFrom(weatherData);
				break;
		}
		const series = [];
		for (const forecast of forecasts) {
			series.push(this.getWeatherDataFrom(forecast, stellarData, weatherData.properties.meta.units));
		}
		return series;
	},

	getHourlyForecastFrom(weatherData) {
		const series = [];

		for (const forecast of weatherData.properties.timeseries) {
			forecast.symbol = forecast.data.next_1_hours?.summary?.symbol_code;
			forecast.precipitation = forecast.data.next_1_hours?.details?.precipitation_amount;
			forecast.minTemperature = forecast.data.next_1_hours?.details?.air_temperature_min;
			forecast.maxTemperature = forecast.data.next_1_hours?.details?.air_temperature_max;
			forecast.weatherType = this.convertWeatherType(forecast.symbol, forecast.time);
			series.push(forecast);
		}
		return series;
	},

	getDailyForecastFrom(weatherData) {
		const series = [];

		const days = weatherData.properties.timeseries.reduce(function (days, forecast) {
			const date = moment(forecast.time).format("YYYY-MM-DD");
			days[date] = days[date] || [];
			days[date].push(forecast);
			return days;
		}, Object.create(null));

		Object.keys(days).forEach(function (time, index) {
			let precipitation_amount_min = undefined;
			let precipitation_amount_max = undefined;

			//Default to first entry
			let forecast = days[time][0];
			forecast.symbol = forecast.data.next_12_hours?.summary?.symbol_code;
			forecast.precipitation = forecast.data.next_12_hours?.details?.precipitation_amount;

			//Coming days
			let forecastDiffToEight = undefined;
			for (const timeseries of days[time]) {
				if (!timeseries.data.next_6_hours) continue; //next_6_hours has the most data

				if (!precipitation_amount_min || timeseries.data.next_6_hours.details.air_temperature_min < precipitation_amount_min) precipitation_amount_min = timeseries.data.next_6_hours.details.air_temperature_min;
				if (!precipitation_amount_max || precipitation_amount_max < timeseries.data.next_6_hours.details.air_temperature_max) precipitation_amount_max = timeseries.data.next_6_hours.details.air_temperature_max;

				let closestTime = Math.abs(moment(timeseries.time).local().set({ hour: 8, minute: 0, second: 0, millisecond: 0 }).diff(moment(timeseries.time).local()));
				if ((forecastDiffToEight === undefined || closestTime < forecastDiffToEight) && timeseries.data.next_12_hours) {
					forecastDiffToEight = closestTime;
					forecast = timeseries;
				}
			}
			const forecastXHours = forecast.data.next_12_hours ?? forecast.data.next_6_hours ?? forecast.data.next_1_hours;
			forecast.symbol = forecastXHours.summary?.symbol_code;
			forecast.precipitation = forecastXHours.details?.precipitation_amount;
			forecast.minTemperature = precipitation_amount_min;
			forecast.maxTemperature = precipitation_amount_max;

			series.push(forecast);
		});
		for (const forecast of series) {
			forecast.weatherType = this.convertWeatherType(forecast.symbol, forecast.time);
		}
		return series;
	},

	fetchWeatherForecast() {
		this.getWeatherForecast("daily")
			.then((forecast) => {
				this.setWeatherForecast(forecast);
				this.updateAvailable();
			})
			.catch((error) => {
				Log.error(error);
				throw new Error(error);
			});
	}
});
