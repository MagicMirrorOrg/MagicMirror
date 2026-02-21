const Log = require("logger");
const { convertKmhToMs, cardinalToDegrees } = require("../provider-utils");
const HTTPFetcher = require("#http_fetcher");

const WEATHER_API_BASE = "https://api.weatherapi.com/v1";

class WeatherAPIProvider {
	constructor (config) {
		this.config = {
			apiBase: WEATHER_API_BASE,
			lat: 0,
			lon: 0,
			type: "current",
			apiKey: "",
			lang: "en",
			maxEntries: 5,
			maxNumberOfDays: 5,
			updateInterval: 10 * 60 * 1000,
			...config
		};

		this.locationName = null;
		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
	}

	async initialize () {
		this.#validateConfig();
		this.#initializeFetcher();
	}

	setCallbacks (onData, onError) {
		this.onDataCallback = onData;
		this.onErrorCallback = onError;
	}

	start () {
		if (this.fetcher) {
			this.fetcher.startPeriodicFetch();
		}
	}

	stop () {
		if (this.fetcher) {
			this.fetcher.clearTimer();
		}
	}

	#validateConfig () {
		this.config.type = `${this.config.type ?? ""}`.trim().toLowerCase();

		if (this.config.type === "forecast") {
			this.config.type = "daily";
		}

		if (!["hourly", "daily", "current"].includes(this.config.type)) {
			throw new Error(`Unknown weather type: ${this.config.type}`);
		}

		if (!this.config.apiKey || `${this.config.apiKey}`.trim() === "") {
			throw new Error("apiKey is required");
		}

		if (!Number.isFinite(this.config.lat) || !Number.isFinite(this.config.lon)) {
			throw new Error("Latitude and longitude are required");
		}
	}

	#initializeFetcher () {
		const url = this.#getUrl();

		this.fetcher = new HTTPFetcher(url, {
			reloadInterval: this.config.updateInterval,
			headers: { "Cache-Control": "no-cache" },
			logContext: "weatherprovider.weatherapi"
		});

		this.fetcher.on("response", async (response) => {
			try {
				const data = await response.json();
				this.#handleResponse(data);
			} catch (error) {
				Log.error("[weatherapi] Failed to parse JSON:", error);
				if (this.onErrorCallback) {
					this.onErrorCallback({
						message: "Failed to parse API response",
						translationKey: "MODULE_ERROR_UNSPECIFIED"
					});
				}
			}
		});

		this.fetcher.on("error", (errorInfo) => {
			if (this.onErrorCallback) {
				this.onErrorCallback(errorInfo);
			}
		});
	}

	#handleResponse (data) {
		let parsedData;

		try {
			parsedData = this.#parseResponse(data);
		} catch (error) {
			Log.error("[weatherapi] Invalid API response:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: "Invalid API response",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
			return;
		}

		try {
			let weatherData;

			switch (this.config.type) {
				case "current":
					weatherData = this.#generateCurrent(parsedData);
					break;
				case "daily":
					weatherData = this.#generateDaily(parsedData);
					break;
				case "hourly":
					weatherData = this.#generateHourly(parsedData);
					break;
				default:
					throw new Error(`Unknown weather type: ${this.config.type}`);
			}

			if (this.onDataCallback && weatherData) {
				this.onDataCallback(weatherData);
			}
		} catch (error) {
			Log.error("[weatherapi] Error processing weather data:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: error.message,
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
		}
	}

	#getQueryParameters () {
		const maxEntries = Number.isFinite(this.config.maxEntries)
			? Math.max(1, this.config.maxEntries)
			: 5;

		const requestedDays = Number.isFinite(this.config.maxNumberOfDays)
			? Math.max(1, this.config.maxNumberOfDays)
			: 5;

		const hourlyDays = Math.max(1, Math.ceil(maxEntries / 24));
		const days = this.config.type === "hourly"
			? Math.min(14, Math.max(requestedDays, hourlyDays))
			: this.config.type === "daily"
				? Math.min(14, requestedDays)
				: 1;

		const params = {
			q: `${this.config.lat},${this.config.lon}`,
			days,
			lang: this.config.lang,
			key: this.config.apiKey
		};

		return Object.keys(params)
			.filter((key) => params[key] !== undefined && params[key] !== null && `${params[key]}`.trim() !== "")
			.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
			.join("&");
	}

	#getUrl () {
		return `${this.config.apiBase}/forecast.json?${this.#getQueryParameters()}`;
	}

	#parseResponse (responseData) {
		responseData.location ??= {};
		responseData.current ??= {};
		responseData.current.condition ??= {};
		responseData.forecast ??= {};
		responseData.forecast.forecastday ??= [];
		responseData.forecast.forecastday = responseData.forecast.forecastday.map((forecastDay) => ({
			...forecastDay,
			astro: forecastDay.astro ?? {},
			day: forecastDay.day ?? {},
			hour: forecastDay.hour ?? []
		}));

		const locationParts = [
			responseData.location.name,
			responseData.location.region,
			responseData.location.country
		]
			.map((value) => `${value}`.trim())
			.filter((value) => value !== "");

		if (locationParts.length > 0) {
			this.locationName = locationParts.join(", ").trim();
		}

		if (
			!responseData.location
			|| !responseData.current
			|| !responseData.forecast
			|| !Array.isArray(responseData.forecast.forecastday)
		) {
			throw new Error("Invalid API response");
		}

		return responseData;
	}

	#parseSunDatetime (forecastDay, key) {
		const timeValue = forecastDay?.astro?.[key];
		if (!timeValue || !forecastDay?.date) {
			return null;
		}

		const match = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i.exec(timeValue);
		if (!match) {
			return null;
		}

		let hour = parseInt(match[1], 10);
		const minute = parseInt(match[2], 10);
		const period = match[3].toUpperCase();

		if (period === "PM" && hour !== 12) hour += 12;
		if (period === "AM" && hour === 12) hour = 0;

		const date = new Date(`${forecastDay.date}T00:00:00`);
		date.setHours(hour, minute, 0, 0);
		return date;
	}

	#toNumber (value) {
		const number = parseFloat(value);
		return Number.isFinite(number) ? number : null;
	}

	#generateCurrent (data) {
		const weather = data.forecast.forecastday[0] ?? {};
		const current = data.current ?? {};
		const currentWeather = {
			date: current.last_updated_epoch ? new Date(current.last_updated_epoch * 1000) : new Date()
		};

		const humidity = this.#toNumber(current.humidity);
		if (humidity !== null) currentWeather.humidity = humidity;

		const temperature = this.#toNumber(current.temp_c);
		if (temperature !== null) currentWeather.temperature = temperature;

		const feelsLikeTemp = this.#toNumber(current.feelslike_c);
		if (feelsLikeTemp !== null) currentWeather.feelsLikeTemp = feelsLikeTemp;

		const windSpeed = this.#toNumber(current.wind_kph);
		if (windSpeed !== null) currentWeather.windSpeed = convertKmhToMs(windSpeed);

		const windFromDirection = this.#toNumber(current.wind_degree);
		if (windFromDirection !== null) currentWeather.windFromDirection = windFromDirection;

		if (current.condition?.code !== undefined) {
			currentWeather.weatherType = this.#convertWeatherType(current.condition.code, current.is_day === 1);
		}

		const sunrise = this.#parseSunDatetime(weather, "sunrise");
		const sunset = this.#parseSunDatetime(weather, "sunset");
		if (sunrise) currentWeather.sunrise = sunrise;
		if (sunset) currentWeather.sunset = sunset;

		const minTemperature = this.#toNumber(weather.day?.mintemp_c);
		if (minTemperature !== null) currentWeather.minTemperature = minTemperature;

		const maxTemperature = this.#toNumber(weather.day?.maxtemp_c);
		if (maxTemperature !== null) currentWeather.maxTemperature = maxTemperature;

		const snow = this.#toNumber(current.snow_cm);
		if (snow !== null) currentWeather.snow = snow * 10;

		const rain = this.#toNumber(current.precip_mm);
		if (rain !== null) currentWeather.rain = rain;

		if (rain !== null || snow !== null) {
			currentWeather.precipitationAmount = (rain ?? 0) + ((snow ?? 0) * 10);
		}

		return currentWeather;
	}

	#generateDaily (data) {
		const days = [];
		const forecastDays = data.forecast.forecastday ?? [];

		for (const forecastDay of forecastDays) {
			const weather = {};
			const dayDate = forecastDay.date_epoch
				? new Date(forecastDay.date_epoch * 1000)
				: new Date(`${forecastDay.date}T00:00:00`);
			const noonHour = forecastDay.hour?.find((entry) => {
				if (!entry.time_epoch) return false;
				return new Date(entry.time_epoch * 1000).getHours() === 12;
			}) ?? forecastDay.hour?.[0];

			const precipitationProbability = forecastDay.hour?.length > 0
				? (forecastDay.hour.reduce((sum, hourData) => {
					const rain = this.#toNumber(hourData.will_it_rain) ?? 0;
					const snow = this.#toNumber(hourData.will_it_snow) ?? 0;
					return sum + ((rain + snow) / 2);
				}, 0) / forecastDay.hour.length) * 100
				: null;

			weather.date = dayDate;
			weather.minTemperature = this.#toNumber(forecastDay.day?.mintemp_c);
			weather.maxTemperature = this.#toNumber(forecastDay.day?.maxtemp_c);
			weather.weatherType = this.#convertWeatherType(forecastDay.day?.condition?.code, true);

			const maxWind = this.#toNumber(forecastDay.day?.maxwind_kph);
			if (maxWind !== null) weather.windSpeed = convertKmhToMs(maxWind);

			if (noonHour?.wind_degree !== undefined) {
				const windDegree = this.#toNumber(noonHour.wind_degree);
				weather.windFromDirection = windDegree !== null
					? windDegree
					: cardinalToDegrees(noonHour?.wind_dir);
			}

			const sunrise = this.#parseSunDatetime(forecastDay, "sunrise");
			const sunset = this.#parseSunDatetime(forecastDay, "sunset");
			if (sunrise) weather.sunrise = sunrise;
			if (sunset) weather.sunset = sunset;

			weather.temperature = this.#toNumber(forecastDay.day?.avgtemp_c);
			weather.humidity = this.#toNumber(forecastDay.day?.avghumidity);

			const snow = this.#toNumber(forecastDay.day?.totalsnow_cm);
			if (snow !== null) weather.snow = snow * 10;

			const rain = this.#toNumber(forecastDay.day?.totalprecip_mm);
			if (rain !== null) weather.rain = rain;

			if (rain !== null || snow !== null) {
				weather.precipitationAmount = (rain ?? 0) + ((snow ?? 0) * 10);
			}

			if (precipitationProbability !== null) {
				weather.precipitationProbability = precipitationProbability;
			}

			weather.uv_index = this.#toNumber(forecastDay.day?.uv);

			days.push(weather);

			if (days.length >= this.config.maxEntries) {
				break;
			}
		}

		return days;
	}

	#generateHourly (data) {
		const hours = [];
		const nowStart = new Date();
		nowStart.setMinutes(0, 0, 0);
		nowStart.setHours(nowStart.getHours() + 1);

		for (const forecastDay of data.forecast.forecastday ?? []) {
			for (const hourData of forecastDay.hour ?? []) {
				const date = hourData.time_epoch
					? new Date(hourData.time_epoch * 1000)
					: new Date(hourData.time);

				if (date < nowStart) {
					continue;
				}

				const weather = { date };

				const sunrise = this.#parseSunDatetime(forecastDay, "sunrise");
				const sunset = this.#parseSunDatetime(forecastDay, "sunset");
				if (sunrise) weather.sunrise = sunrise;
				if (sunset) weather.sunset = sunset;

				weather.minTemperature = this.#toNumber(forecastDay.day?.mintemp_c);
				weather.maxTemperature = this.#toNumber(forecastDay.day?.maxtemp_c);
				weather.humidity = this.#toNumber(hourData.humidity);

				const windSpeed = this.#toNumber(hourData.wind_kph);
				if (windSpeed !== null) weather.windSpeed = convertKmhToMs(windSpeed);

				const windDegree = this.#toNumber(hourData.wind_degree);
				weather.windFromDirection = windDegree !== null
					? windDegree
					: cardinalToDegrees(hourData.wind_dir);

				weather.weatherType = this.#convertWeatherType(hourData.condition?.code, hourData.is_day === 1);

				const snow = this.#toNumber(hourData.snow_cm);
				if (snow !== null) weather.snow = snow * 10;

				weather.temperature = this.#toNumber(hourData.temp_c);
				weather.precipitationAmount = this.#toNumber(hourData.precip_mm);

				const willRain = this.#toNumber(hourData.will_it_rain) ?? 0;
				const willSnow = this.#toNumber(hourData.will_it_snow) ?? 0;
				weather.precipitationProbability = (willRain + willSnow) * 50;

				weather.uv_index = this.#toNumber(hourData.uv);

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
	}

	#convertWeatherType (weatherCode, isDayTime) {
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

		if (!Object.prototype.hasOwnProperty.call(weatherConditions, weatherCode)) {
			return "na";
		}

		return weatherConditions[weatherCode][isDayTime ? "day" : "night"];
	}
}

module.exports = WeatherAPIProvider;
