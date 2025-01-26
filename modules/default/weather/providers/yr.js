/* global WeatherProvider, WeatherObject */

/*
 * This class is a provider for Yr.no, a norwegian weather service.
 * Terms of service: https://developer.yr.no/doc/TermsOfService/
 */
WeatherProvider.register("yr", {
	providerName: "Yr",

	// Set the default config properties that is specific to this provider
	defaults: {
		useCorsProxy: true,
		apiBase: "https://api.met.no/weatherapi",
		forecastApiVersion: "2.0",
		sunriseApiVersion: "3.0",
		altitude: 0,
		currentForecastHours: 1 //1, 6 or 12
	},

	start () {
		if (typeof Storage === "undefined") {
			//local storage unavailable
			Log.error("The Yr weather provider requires local storage.");
			throw new Error("Local storage not available");
		}
		if (this.config.updateInterval < 600000) {
			Log.warn("The Yr weather provider requires a minimum update interval of 10 minutes (600 000 ms). The configuration has been adjusted to meet this requirement.");
			this.delegate.config.updateInterval = 600000;
		}
		Log.info(`Weather provider: ${this.providerName} started.`);
	},

	fetchCurrentWeather () {
		this.getCurrentWeather()
			.then((currentWeather) => {
				this.setCurrentWeather(currentWeather);
				this.updateAvailable();
			})
			.catch((error) => {
				Log.error(error);
				this.updateAvailable();
			});
	},

	async getCurrentWeather () {
		const [weatherData, stellarData] = await Promise.all([this.getWeatherData(), this.getStellarData()]);
		if (!stellarData) {
			Log.warn("No stellar data available.");
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
		forecast.precipitationAmount = forecastXHours.details?.precipitation_amount;
		forecast.precipitationProbability = forecastXHours.details?.probability_of_precipitation;
		forecast.minTemperature = forecastXHours.details?.air_temperature_min;
		forecast.maxTemperature = forecastXHours.details?.air_temperature_max;
		return this.getWeatherDataFrom(forecast, stellarData, weatherData.properties.meta.units);
	},

	getWeatherData () {
		return new Promise((resolve, reject) => {

			/*
			 * If a user has several Yr-modules, for instance one current and one forecast, the API calls must be synchronized across classes.
			 * This is to avoid multiple similar calls to the API.
			 */
			let shouldWait = localStorage.getItem("yrIsFetchingWeatherData");
			if (shouldWait) {
				const checkForGo = setInterval(function () {
					shouldWait = localStorage.getItem("yrIsFetchingWeatherData");
				}, 100);
				setTimeout(function () {
					clearInterval(checkForGo);
					shouldWait = false;
				}, 5000); //Assume other fetch finished but failed to remove lock
				const attemptFetchWeather = setInterval(() => {
					if (!shouldWait) {
						clearInterval(checkForGo);
						clearInterval(attemptFetchWeather);
						this.getWeatherDataFromYrOrCache(resolve, reject);
					}
				}, 100);
			} else {
				this.getWeatherDataFromYrOrCache(resolve, reject);
			}
		});
	},

	getWeatherDataFromYrOrCache (resolve, reject) {
		localStorage.setItem("yrIsFetchingWeatherData", "true");

		let weatherData = this.getWeatherDataFromCache();
		if (this.weatherDataIsValid(weatherData)) {
			localStorage.removeItem("yrIsFetchingWeatherData");
			Log.debug("Weather data found in cache.");
			resolve(weatherData);
		} else {
			this.getWeatherDataFromYr(weatherData?.downloadedAt)
				.then((weatherData) => {
					Log.debug("Got weather data from yr.");
					let data;
					if (weatherData) {
						this.cacheWeatherData(weatherData);
						data = weatherData;
					} else {
						//Undefined if unchanged
						data = this.getWeatherDataFromCache();
					}
					resolve(data);
				})
				.catch((err) => {
					Log.error(err);
					if (weatherData) {
						Log.warn("Using outdated cached weather data.");
						resolve(weatherData);
					} else {
						reject("Unable to get weather data from Yr.");
					}
				})
				.finally(() => {
					localStorage.removeItem("yrIsFetchingWeatherData");
				});
		}
	},

	weatherDataIsValid (weatherData) {
		return (
			weatherData
			&& weatherData.timeout
			&& 0 < moment(weatherData.timeout).diff(moment())
			&& (!weatherData.geometry || !weatherData.geometry.coordinates || !weatherData.geometry.coordinates.length < 2 || (weatherData.geometry.coordinates[0] === this.config.lat && weatherData.geometry.coordinates[1] === this.config.lon))
		);
	},

	getWeatherDataFromCache () {
		const weatherData = localStorage.getItem("weatherData");
		if (weatherData) {
			return JSON.parse(weatherData);
		} else {
			return undefined;
		}
	},

	getWeatherDataFromYr (currentDataFetchedAt) {
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

	getConfigOptions () {
		if (!this.config.lat) {
			Log.error("Latitude not provided.");
			throw new Error("Latitude not provided.");
		}
		if (!this.config.lon) {
			Log.error("Longitude not provided.");
			throw new Error("Longitude not provided.");
		}

		let lat = this.config.lat.toString();
		let lon = this.config.lon.toString();
		const altitude = this.config.altitude ?? 0;
		return { lat, lon, altitude };
	},

	getForecastUrl () {
		let { lat, lon, altitude } = this.getConfigOptions();

		if (lat.includes(".") && lat.split(".")[1].length > 4) {
			Log.warn("Latitude is too specific for weather data. Do not use more than four decimals. Trimming to maximum length.");
			const latParts = lat.split(".");
			lat = `${latParts[0]}.${latParts[1].substring(0, 4)}`;
		}
		if (lon.includes(".") && lon.split(".")[1].length > 4) {
			Log.warn("Longitude is too specific for weather data. Do not use more than four decimals. Trimming to maximum length.");
			const lonParts = lon.split(".");
			lon = `${lonParts[0]}.${lonParts[1].substring(0, 4)}`;
		}

		return `${this.config.apiBase}/locationforecast/${this.config.forecastApiVersion}/complete?&altitude=${altitude}&lat=${lat}&lon=${lon}`;
	},

	cacheWeatherData (weatherData) {
		localStorage.setItem("weatherData", JSON.stringify(weatherData));
	},

	getStellarData () {

		/*
		 * If a user has several Yr-modules, for instance one current and one forecast, the API calls must be synchronized across classes.
		 * This is to avoid multiple similar calls to the API.
		 */
		return new Promise((resolve, reject) => {
			let shouldWait = localStorage.getItem("yrIsFetchingStellarData");
			if (shouldWait) {
				const checkForGo = setInterval(function () {
					shouldWait = localStorage.getItem("yrIsFetchingStellarData");
				}, 100);
				setTimeout(function () {
					clearInterval(checkForGo);
					shouldWait = false;
				}, 5000); //Assume other fetch finished but failed to remove lock
				const attemptFetchWeather = setInterval(() => {
					if (!shouldWait) {
						clearInterval(checkForGo);
						clearInterval(attemptFetchWeather);
						this.getStellarDataFromYrOrCache(resolve, reject);
					}
				}, 100);
			} else {
				this.getStellarDataFromYrOrCache(resolve, reject);
			}
		});
	},

	getStellarDataFromYrOrCache (resolve, reject) {
		localStorage.setItem("yrIsFetchingStellarData", "true");

		let stellarData = this.getStellarDataFromCache();
		const today = moment().format("YYYY-MM-DD");
		const tomorrow = moment().add(1, "days").format("YYYY-MM-DD");
		if (stellarData && stellarData.today && stellarData.today.date === today && stellarData.tomorrow && stellarData.tomorrow.date === tomorrow) {
			Log.debug("Stellar data found in cache.");
			localStorage.removeItem("yrIsFetchingStellarData");
			resolve(stellarData);
		} else if (stellarData && stellarData.tomorrow && stellarData.tomorrow.date === today) {
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
						reject(`No stellar data returned from Yr for ${tomorrow}`);
					}
				})
				.catch((err) => {
					Log.error(err);
					reject(`Unable to get stellar data from Yr for ${tomorrow}`);
				})
				.finally(() => {
					localStorage.removeItem("yrIsFetchingStellarData");
				});
		} else {
			this.getStellarDataFromYr(today, 2)
				.then((stellarData) => {
					if (stellarData) {
						const data = {
							today: stellarData
						};
						data.tomorrow = Object.assign({}, data.today);
						data.today.date = today;
						data.tomorrow.date = tomorrow;
						this.cacheStellarData(data);
						resolve(data);
					} else {
						Log.error(`Something went wrong when fetching stellar data. Responses: ${stellarData}`);
						reject(stellarData);
					}
				})
				.catch((err) => {
					Log.error(err);
					reject("Unable to get stellar data from Yr.");
				})
				.finally(() => {
					localStorage.removeItem("yrIsFetchingStellarData");
				});
		}
	},

	getStellarDataFromCache () {
		const stellarData = localStorage.getItem("stellarData");
		if (stellarData) {
			return JSON.parse(stellarData);
		} else {
			return undefined;
		}
	},

	getStellarDataFromYr (date, days = 1) {
		const requestHeaders = [{ name: "Accept", value: "application/json" }];
		return this.fetchData(this.getStellarDataUrl(date, days), "json", requestHeaders)
			.then((data) => {
				Log.debug("Got stellar data from yr.");
				return data;
			})
			.catch((err) => {
				Log.error("Could not load weather data.", err);
				throw new Error(err);
			});
	},

	getStellarDataUrl (date, days) {
		let { lat, lon, altitude } = this.getConfigOptions();

		if (lat.includes(".") && lat.split(".")[1].length > 4) {
			Log.warn("Latitude is too specific for stellar data. Do not use more than four decimals. Trimming to maximum length.");
			const latParts = lat.split(".");
			lat = `${latParts[0]}.${latParts[1].substring(0, 4)}`;
		}
		if (lon.includes(".") && lon.split(".")[1].length > 4) {
			Log.warn("Longitude is too specific for stellar data. Do not use more than four decimals. Trimming to maximum length.");
			const lonParts = lon.split(".");
			lon = `${lonParts[0]}.${lonParts[1].substring(0, 4)}`;
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
		return `${this.config.apiBase}/sunrise/${this.config.sunriseApiVersion}/sun?lat=${lat}&lon=${lon}&date=${date}&offset=${utcOffsetPrefix}${hours}%3A${minutes}`;
	},

	cacheStellarData (data) {
		localStorage.setItem("stellarData", JSON.stringify(data));
	},

	getWeatherDataFrom (forecast, stellarData, units) {
		const weather = new WeatherObject();

		weather.date = moment(forecast.time);
		weather.windSpeed = forecast.data.instant.details.wind_speed;
		weather.windFromDirection = forecast.data.instant.details.wind_from_direction;
		weather.temperature = forecast.data.instant.details.air_temperature;
		weather.minTemperature = forecast.minTemperature;
		weather.maxTemperature = forecast.maxTemperature;
		weather.weatherType = forecast.weatherType;
		weather.humidity = forecast.data.instant.details.relative_humidity;
		weather.precipitationAmount = forecast.precipitationAmount;
		weather.precipitationProbability = forecast.precipitationProbability;
		weather.precipitationUnits = units.precipitation_amount;

		weather.sunrise = stellarData?.today?.properties?.sunrise?.time;
		weather.sunset = stellarData?.today?.properties?.sunset?.time;

		return weather;
	},

	convertWeatherType (weatherType, weatherTime) {
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

	getForecastForXHoursFrom (weather) {
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

	fetchWeatherHourly () {
		this.getWeatherForecast("hourly")
			.then((forecast) => {
				this.setWeatherHourly(forecast);
				this.updateAvailable();
			})
			.catch((error) => {
				Log.error(error);
				this.updateAvailable();
			});
	},

	async getWeatherForecast (type) {
		const [weatherData, stellarData] = await Promise.all([this.getWeatherData(), this.getStellarData()]);
		if (!weatherData.properties.timeseries || !weatherData.properties.timeseries[0]) {
			Log.error("No weather data available.");
			return;
		}
		if (!stellarData) {
			Log.warn("No stellar data available.");
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

	getHourlyForecastFrom (weatherData) {
		const series = [];

		const now = moment({
			year: moment().year(),
			month: moment().month(),
			day: moment().date(),
			hour: moment().hour()
		});
		for (const forecast of weatherData.properties.timeseries) {
			if (now.isAfter(moment(forecast.time))) continue;

			forecast.symbol = forecast.data.next_1_hours?.summary?.symbol_code;
			forecast.precipitationAmount = forecast.data.next_1_hours?.details?.precipitation_amount;
			forecast.precipitationProbability = forecast.data.next_1_hours?.details?.probability_of_precipitation;
			forecast.minTemperature = forecast.data.next_1_hours?.details?.air_temperature_min;
			forecast.maxTemperature = forecast.data.next_1_hours?.details?.air_temperature_max;
			forecast.weatherType = this.convertWeatherType(forecast.symbol, forecast.time);
			series.push(forecast);
		}
		return series;
	},

	getDailyForecastFrom (weatherData) {
		const series = [];

		const days = weatherData.properties.timeseries.reduce(function (days, forecast) {
			const date = moment(forecast.time).format("YYYY-MM-DD");
			days[date] = days[date] || [];
			days[date].push(forecast);
			return days;
		}, Object.create(null));

		Object.keys(days).forEach(function (time) {
			let minTemperature = undefined;
			let maxTemperature = undefined;

			//Default to first entry
			let forecast = days[time][0];
			forecast.symbol = forecast.data.next_12_hours?.summary?.symbol_code;
			forecast.precipitation = forecast.data.next_12_hours?.details?.precipitation_amount;

			//Coming days
			let forecastDiffToEight = undefined;
			for (const timeseries of days[time]) {
				if (!timeseries.data.next_6_hours) continue; //next_6_hours has the most data

				if (!minTemperature || timeseries.data.next_6_hours.details.air_temperature_min < minTemperature) minTemperature = timeseries.data.next_6_hours.details.air_temperature_min;
				if (!maxTemperature || maxTemperature < timeseries.data.next_6_hours.details.air_temperature_max) maxTemperature = timeseries.data.next_6_hours.details.air_temperature_max;

				let closestTime = Math.abs(moment(timeseries.time).local().set({ hour: 8, minute: 0, second: 0, millisecond: 0 }).diff(moment(timeseries.time).local()));
				if ((forecastDiffToEight === undefined || closestTime < forecastDiffToEight) && timeseries.data.next_12_hours) {
					forecastDiffToEight = closestTime;
					forecast = timeseries;
				}
			}
			const forecastXHours = forecast.data.next_12_hours ?? forecast.data.next_6_hours ?? forecast.data.next_1_hours;
			if (forecastXHours) {
				forecast.symbol = forecastXHours.summary?.symbol_code;
				forecast.precipitationAmount = forecastXHours.details?.precipitation_amount ?? forecast.data.next_6_hours?.details?.precipitation_amount; // 6 hours is likely to have precipitation amount even if 12 hours does not
				forecast.precipitationProbability = forecastXHours.details?.probability_of_precipitation;
				forecast.minTemperature = minTemperature;
				forecast.maxTemperature = maxTemperature;

				series.push(forecast);
			}
		});
		for (const forecast of series) {
			forecast.weatherType = this.convertWeatherType(forecast.symbol, forecast.time);
		}
		return series;
	},

	fetchWeatherForecast () {
		this.getWeatherForecast("daily")
			.then((forecast) => {
				this.setWeatherForecast(forecast);
				this.updateAvailable();
			})
			.catch((error) => {
				Log.error(error);
				this.updateAvailable();
			});
	}
});
