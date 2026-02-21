/* global WeatherProvider, WeatherObject */

/*
 * This class is a provider for Weather API,
 * see https://www.weatherapi.com/docs/
 */

const WEATHER_API_BASE = "https://api.weatherapi.com/v1";
const EMPTY_RESPONSE_DATA = {
	location: {
		name: "",
		region: "",
		country: "",
		lat: 0,
		lon: 0,
		tz_id: "",
		localtime_epoch: 0,
		localtime: ""
	},
	forecast: {
		forecastday: []
	}
};

WeatherProvider.register("weatherapi", {
	/*
	 * Set the name of the provider.
	 * Not strictly required but helps for debugging.
	 */
	providerName: "Weather API",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiBase: WEATHER_API_BASE,
		lat: 0,
		lon: 0,
		type: "current",
		apiKey: ""
	},

	requestForecast () {
		return new Promise((resolve, reject) => {
			this.fetchData(this.getForecastUrl())
				.then((data) => resolve(data))
				.catch((request) => reject(request));
		});
	},

	preProcessResponses (responseData) {
		// Ensure nested structures
		responseData.location ??= {};
		responseData.current ??= {};
		responseData.current.condition ??= {};
		responseData.forecast ??= {};
		responseData.forecast.forecastday ??= [];
		responseData.forecast.forecastday = responseData.forecast.forecastday.map((fd) => ({
			...fd,
			astro: fd.astro ?? {},
			day: fd.day ?? {},
			hour: fd.hour ?? []
		}));

		const locationParts = [responseData.location.name, responseData.location.region, responseData.location.country].map((v) => `${v}`.trim()).filter((v) => v !== "");

		if (locationParts.length > 0) {
			this.setFetchedLocation(locationParts.join(", ").trim());
		}

		return responseData;
	},

	fetchCurrentWeather () {
		this.requestForecast()
			.then((data) => this.preProcessResponses(data))
			.then((data) => this.parseWeatherApiResponse(data))
			.then((parsedData) => {
				if (!parsedData) {
					// No usable data?
					return;
				}

				const currentWeather = this.generateWeatherDayFromCurrentWeather(parsedData);
				this.setCurrentWeather(currentWeather);
			})
			.catch(function (err) {
				Log.error("[weatherprovider.weatherapi] Could not load data ... ", err);
			})
			.finally(() => this.updateAvailable());
	},

	fetchWeatherForecast () {
		this.requestForecast()
			.then((data) => this.preProcessResponses(data))
			.then((data) => this.parseWeatherApiResponse(data))
			.then((parsedData) => {
				if (!parsedData) {
					// No usable data?
					return;
				}

				const dailyForecast = this.generateWeatherObjectsFromForecast(parsedData);

				this.setWeatherForecast(dailyForecast);
			})
			.catch(function (err) {
				Log.error("[weatherprovider.weatherapi] Could not load data ... ", err);
			})
			.finally(() => this.updateAvailable());
	},

	fetchWeatherHourly () {
		this.requestForecast()
			.then((data) => this.preProcessResponses(data))
			.then((data) => this.parseWeatherApiResponse(data))
			.then((parsedData) => {
				if (!parsedData) {
					// No usable data?
					return;
				}

				const hourlyForecast = this.generateWeatherObjectsFromHourly(parsedData);
				this.setWeatherHourly(hourlyForecast);
			})
			.catch(function (request) {
				Log.error("[weatherprovider.weatherapi] Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	// Sanitize config
	validateConfig () {
		this.config.type = `${this.config.type ?? ""}`.trim().toLowerCase();
		Object.keys(this.defaults).forEach((key) => {
			if (typeof this.config[key] === "undefined" || this.config[key] === null || `${this.config[key]}`.trim() === "") {
				const message = `[weatherprovider.weatherapi] ${key} not configured`;
				Log.error(message);
				throw new Error(message);
			}
		});

		if (this.config.type === "forecast") this.config.type = "daily";
		if (!["hourly", "daily", "current"].includes(this.config.type)) {
			const message = `[weatherprovider.weatherapi] Unknown type: ${this.config.type}`;
			Log.error(message);
			throw new Error(message);
		}

		// fix values
		if (this.config.type === "current") {
			this.config.maxEntries = 1;
			this.config.maxNumberOfDays = 1;
			this.config.ignoreToday = false;
		} else {
			this.config.ignoreToday = !!this.config.ignoreToday;
		}
	},

	/**
	 * Overrides method for setting config to check if endpoint is correct for hourly
	 * @param {object} config The configuration object
	 */
	setConfig (config) {
		this.fetchedLocationName = null;
		this.config = {
			lang: config.lang ?? "en",
			...this.defaults,
			...config
		};

		this.validateConfig();
	},

	// Generate valid query params to perform the request
	getForecastQueryParameters () {
		let params = {
			q: `${this.config.lat},${this.config.lon}`,
			unixdt: moment().valueOf(),
			days: this.config.maxNumberOfDays,
			lang: this.config.lang,
			tp: 60,
			key: this.config.apiKey
		};

		return Object.keys(params)
			.filter((key) => !!params[key])
			.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`.trim())
			.join("&");
	},

	// Create a URL from the config and base URL.
	getForecastUrl () {
		return `${this.config.apiBase}/forecast.json?${this.getForecastQueryParameters()}`;
	},

	// fix daylight-saving-time differences
	checkDST (dt) {
		const uxdt = moment.unix(dt);
		const nowDST = moment().isDST();
		if (nowDST === moment(uxdt).isDST()) {
			return uxdt;
		} else {
			return uxdt.add(nowDST ? +1 : -1, "hour");
		}
	},

	// Transpose hourly and daily data matrices
	transposeDataMatrix (data) {
		return data.time.map((_, index) => Object.keys(data).reduce((row, key) => {
			return {
				...row,
				// Parse time values as moment.js instances
				[key]: ["time", "sunrise", "sunset"].includes(key) ? this.checkDST(data[key][index]) : data[key][index]
			};
		}, {}));
	},

	// Sanitize and validate API response
	parseWeatherApiResponse (data) {
		const _isObject = (obj) => obj && typeof obj === "object" && obj !== null && !Array.isArray(obj);
		const _isArray = (obj) => obj && Array.isArray(obj);

		if (_isObject(data.location) && _isObject(data.current) && _isObject(data.forecast) && _isArray(data.forecast.forecastday)) {
			return data;
		}

		throw new Error("Invalid API response");
	},

	// Parse sunrise and sunset moments
	parseSunDatetime (forecastDay, key) {
		const { date, astro } = forecastDay;
		return moment(`${date} ${astro[key]}`, "YYYY-MM-DD hh:mm A");
	},

	// Implement WeatherDay generator.
	generateWeatherDayFromCurrentWeather (data) {
		const fd = data.forecast.forecastday[0];
		const weather = new WeatherObject();

		weather.date = moment();
		weather.humidity = parseFloat(data.current.humidity);
		weather.temperature = parseFloat(data.current.temp_c);
		weather.feelsLikeTemp = parseFloat(data.current.feelslike_c);
		weather.windSpeed = parseFloat(data.current.wind_kph) * 0.2778;
		weather.windFromDirection = parseFloat(data.current.wind_degree);
		weather.weatherType = this.convertWeatherType(data.current.condition.code, data.current.is_day === 1);
		weather.sunrise = this.parseSunDatetime(fd, "sunrise");
		weather.sunset = this.parseSunDatetime(fd, "sunset");
		// Optional
		weather.minTemperature = parseFloat(fd.day.mintemp_c);
		weather.maxTemperature = parseFloat(fd.day.maxtemp_c);
		weather.snow = parseFloat(data.current.snow_cm * 10);
		weather.rain = parseFloat(data.current.precip_mm);
		weather.precipitationAmount = weather.rain + weather.snow;
		weather.uv_index = parseFloat(data.current.uv);

		return weather;
	},

	// Implement WeatherForecast generator.
	generateWeatherObjectsFromForecast (data) {
		const days = [];

		for (const fd of data.forecast.forecastday) {
			const weather = new WeatherObject();

			const precipitationProbability
				= (fd.hour.reduce((acc, h) => {
					const idxValue = ((h.will_it_rain ?? 0) + (h.will_it_snow ?? 0)) / 2;
					return acc + idxValue;
				}, 0)
				/ fd.hour.length)
			* 100;

			const avgwind_degree
				= fd.hour.reduce((acc, h) => {
					return acc + (h.wind_degree ?? 0);
				}, 0) / fd.hour.length;

			weather.date = moment(fd.date).startOf("day");
			weather.minTemperature = parseFloat(fd.day.mintemp_c);
			weather.maxTemperature = parseFloat(fd.day.maxtemp_c);
			weather.weatherType = this.convertWeatherType(fd.day.condition.code, true);
			weather.windSpeed = parseFloat(fd.day.maxwind_kph) * 0.2778;
			weather.windFromDirection = parseFloat(avgwind_degree);
			weather.sunrise = this.parseSunDatetime(fd, "sunrise");
			weather.sunset = this.parseSunDatetime(fd, "sunset");
			weather.temperature = parseFloat(fd.day.avgtemp_c);
			weather.humidity = parseFloat(fd.day.avghumidity);
			weather.snow = parseFloat(fd.day.totalsnow_cm * 10);
			weather.rain = parseFloat(fd.day.totalprecip_mm);
			weather.precipitationAmount = weather.rain + weather.snow;
			weather.precipitationProbability = precipitationProbability;
			weather.uv_index = parseFloat(fd.day.uv);

			days.push(weather);

			if (days.length >= this.config.maxEntries) {
				break;
			}
		}

		return days;
	},

	// Implement WeatherHourly generator.
	generateWeatherObjectsFromHourly (data) {
		const hours = [];
		const now = moment();
		const nowStart = moment(now).add(1, "hour").startOf("hour");

		for (const fd of data.forecast.forecastday) {
			for (const h of fd.hour) {
				const currentMoment = moment(h.time, "YYYY-MM-DD HH:00");
				if (currentMoment.isBefore(nowStart)) {
					continue;
				}

				const weather = new WeatherObject();

				weather.date = currentMoment;
				weather.sunrise = this.parseSunDatetime(fd, "sunrise");
				weather.sunset = this.parseSunDatetime(fd, "sunset");
				weather.minTemperature = parseFloat(fd.day.mintemp_c);
				weather.maxTemperature = parseFloat(fd.day.maxtemp_c);
				weather.humidity = parseFloat(h.humidity);
				weather.windSpeed = parseFloat(h.wind_kph) * 0.2778;
				weather.windFromDirection = parseFloat(h.wind_degree);
				weather.weatherType = this.convertWeatherType(h.condition.code, h.is_day === 1);
				weather.snow = parseFloat(h.snow_cm * 10);
				weather.temperature = parseFloat(h.temp_c);
				weather.precipitationAmount = parseFloat(h.precip_mm);
				weather.precipitationProbability = ((h.will_it_rain ?? 0) + (h.will_it_snow ?? 0)) * 50;
				weather.uv_index = parseFloat(h.uv);

				hours.push(weather);

				if (hours.length >= this.config.maxEntries) {
					break;
				}
			}

			if (hours.length >= this.config.maxEntries) {
				break;
			}
		}

		return hours;
	},

	// Map icons from Dark Sky to our icons.
	convertWeatherType (weathercode, isDayTime) {
		const weatherConditions = {
			1000: { day: "day-sunny", night: "night-clear" },
			1003: { day: "day-cloudy", night: "night-alt-cloudy" },
			1006: { day: "day-cloudy", night: "night-alt-cloudy" },
			1009: { day: "day-sunny-overcast", night: "night-alt-partly-cloudy" },
			1030: { day: "day-fog", night: "night-fog" },
			1063: { day: "day-sprinkle", night: "night-sprinkle" },
			1066: { day: "day-snow-wind", night: "night-snow-wind" },
			1069: { day: "day-sleet", night: "night-sleet" },
			1072: { day: "day-sprinkle", night: "night-sprinkle" },
			1087: { day: "day-thunderstorm", night: "night-thunderstorm" },
			1114: { day: "day-snow-wind", night: "night-snow-wind" },
			1117: { day: "windy", night: "windy" },
			1135: { day: "day-fog", night: "night-fog" },
			1147: { day: "day-fog", night: "night-fog" },
			1150: { day: "day-sprinkle", night: "night-sprinkle" },
			1153: { day: "day-sprinkle", night: "night-sprinkle" },
			1168: { day: "day-sprinkle", night: "night-sprinkle" },
			1171: { day: "day-sprinkle", night: "night-sprinkle" },
			1180: { day: "day-sprinkle", night: "night-sprinkle" },
			1183: { day: "day-sprinkle", night: "night-sprinkle" },
			1186: { day: "day-showers", night: "night-showers" },
			1189: { day: "day-showers", night: "night-showers" },
			1192: { day: "day-showers", night: "night-showers" },
			1195: { day: "day-showers", night: "night-showers" },
			1198: { day: "day-thunderstorm", night: "night-thunderstorm" },
			1201: { day: "day-thunderstorm", night: "night-thunderstorm" },
			1204: { day: "day-sprinkle", night: "night-sprinkle" },
			1207: { day: "day-showers", night: "night-showers" },
			1210: { day: "snowflake-cold", night: "snowflake-cold" },
			1213: { day: "snowflake-cold", night: "snowflake-cold" },
			1216: { day: "snowflake-cold", night: "snowflake-cold" },
			1219: { day: "snowflake-cold", night: "snowflake-cold" },
			1222: { day: "snowflake-cold", night: "snowflake-cold" },
			1225: { day: "snowflake-cold", night: "snowflake-cold" },
			1237: { day: "day-sleet", night: "night-sleet" },
			1240: { day: "day-sprinkle", night: "night-sprinkle" },
			1243: { day: "day-showers", night: "night-showers" },
			1246: { day: "day-showers", night: "night-showers" },
			1249: { day: "day-showers", night: "night-showers" },
			1252: { day: "day-showers", night: "night-showers" },
			1255: { day: "day-snow-wind", night: "night-snow-wind" },
			1258: { day: "day-snow-wind", night: "night-snow-wind" },
			1261: { day: "day-sleet", night: "night-sleet" },
			1264: { day: "day-sleet", night: "night-sleet" },
			1273: { day: "day-thunderstorm", night: "night-thunderstorm" },
			1276: { day: "day-thunderstorm", night: "night-thunderstorm" },
			1279: { day: "day-snow-thunderstorm", night: "night-snow-thunderstorm" },
			1282: { day: "day-snow-thunderstorm", night: "night-snow-thunderstorm" }
		};

		if (!Object.keys(weatherConditions).includes(`${weathercode}`)) return "na";
		return weatherConditions[`${weathercode}`][isDayTime ? "day" : "night"];
	},

	// Define required scripts.
	getScripts () {
		return ["moment.js"];
	}
});
