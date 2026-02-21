const Log = require("logger");
const { getDateString } = require("../provider-utils");
const HTTPFetcher = require("#http_fetcher");

// https://www.bigdatacloud.com/docs/api/free-reverse-geocode-to-city-api
const GEOCODE_BASE = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";

/**
 * Server-side weather provider for Open-Meteo
 * see https://open-meteo.com/
 */
class OpenMeteoProvider {
	// https://open-meteo.com/en/docs
	hourlyParams = [
		"temperature_2m",
		"relativehumidity_2m",
		"dewpoint_2m",
		"apparent_temperature",
		"pressure_msl",
		"surface_pressure",
		"cloudcover",
		"cloudcover_low",
		"cloudcover_mid",
		"cloudcover_high",
		"windspeed_10m",
		"windspeed_80m",
		"windspeed_120m",
		"windspeed_180m",
		"winddirection_10m",
		"winddirection_80m",
		"winddirection_120m",
		"winddirection_180m",
		"windgusts_10m",
		"shortwave_radiation",
		"direct_radiation",
		"direct_normal_irradiance",
		"diffuse_radiation",
		"vapor_pressure_deficit",
		"cape",
		"evapotranspiration",
		"et0_fao_evapotranspiration",
		"precipitation",
		"snowfall",
		"precipitation_probability",
		"rain",
		"showers",
		"weathercode",
		"snow_depth",
		"freezinglevel_height",
		"visibility",
		"soil_temperature_0cm",
		"soil_temperature_6cm",
		"soil_temperature_18cm",
		"soil_temperature_54cm",
		"soil_moisture_0_1cm",
		"soil_moisture_1_3cm",
		"soil_moisture_3_9cm",
		"soil_moisture_9_27cm",
		"soil_moisture_27_81cm",
		"uv_index",
		"uv_index_clear_sky",
		"is_day",
		"terrestrial_radiation",
		"terrestrial_radiation_instant",
		"shortwave_radiation_instant",
		"diffuse_radiation_instant",
		"direct_radiation_instant",
		"direct_normal_irradiance_instant"
	];

	dailyParams = [
		"temperature_2m_max",
		"temperature_2m_min",
		"apparent_temperature_min",
		"apparent_temperature_max",
		"precipitation_sum",
		"rain_sum",
		"showers_sum",
		"snowfall_sum",
		"precipitation_hours",
		"weathercode",
		"sunrise",
		"sunset",
		"windspeed_10m_max",
		"windgusts_10m_max",
		"winddirection_10m_dominant",
		"shortwave_radiation_sum",
		"uv_index_max",
		"et0_fao_evapotranspiration"
	];

	constructor (config) {
		this.config = {
			apiBase: OPEN_METEO_BASE,
			lat: 0,
			lon: 0,
			pastDays: 0,
			type: "current",
			maxNumberOfDays: 5,
			maxEntries: 5,
			updateInterval: 10 * 60 * 1000,
			...config
		};

		this.locationName = null;
		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
	}

	async initialize () {
		await this.#fetchLocation();
		this.#initializeFetcher();
	}

	/**
	 * Set callbacks for data/error events
	 * @param {(data: object) => void} onData - Called with weather data
	 * @param {(error: object) => void} onError - Called with error info
	 */
	setCallbacks (onData, onError) {
		this.onDataCallback = onData;
		this.onErrorCallback = onError;
	}

	/**
	 * Start periodic fetching
	 */
	start () {
		if (this.fetcher) {
			this.fetcher.startPeriodicFetch();
		}
	}

	/**
	 * Stop periodic fetching
	 */
	stop () {
		if (this.fetcher) {
			this.fetcher.clearTimer();
		}
	}

	async #fetchLocation () {
		const url = `${GEOCODE_BASE}?latitude=${this.config.lat}&longitude=${this.config.lon}&localityLanguage=${this.config.lang || "en"}`;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const data = await response.json();
			if (data && data.city) {
				this.locationName = `${data.city}, ${data.principalSubdivisionCode}`;
			}
		} catch (error) {
			Log.error("Could not load location data:", error);
		}
	}

	#initializeFetcher () {
		const url = this.#getUrl();

		this.fetcher = new HTTPFetcher(url, {
			reloadInterval: this.config.updateInterval,
			headers: { "Cache-Control": "no-cache" },
			logContext: "weatherprovider.openmeteo"
		});

		this.fetcher.on("response", async (response) => {
			try {
				const data = await response.json();
				this.#handleResponse(data);
			} catch (error) {
				Log.error("Failed to parse JSON:", error);
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
		const parsedData = this.#parseWeatherApiResponse(data);

		if (!parsedData) {
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
					weatherData = this.#generateWeatherDayFromCurrentWeather(parsedData);
					break;
				case "forecast":
				case "daily":
					weatherData = this.#generateWeatherObjectsFromForecast(parsedData);
					break;
				case "hourly":
					weatherData = this.#generateWeatherObjectsFromHourly(parsedData);
					break;
				default:
					Log.error(`Unknown type: ${this.config.type}`);
					throw new Error(`Unknown weather type: ${this.config.type}`);
			}

			if (weatherData && this.onDataCallback) {
				this.onDataCallback(weatherData);
			}
		} catch (error) {
			Log.error("Error processing weather data:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: error.message,
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
		}
	}

	#getQueryParameters () {
		const maxEntriesLimit = ["daily", "forecast"].includes(this.config.type) ? 7 : this.config.type === "hourly" ? 48 : 0;
		let maxEntries = this.config.maxEntries;
		let maxNumberOfDays = this.config.maxNumberOfDays;

		if (this.config.maxNumberOfDays !== undefined && !isNaN(parseFloat(this.config.maxNumberOfDays))) {
			const daysFactor = ["daily", "forecast"].includes(this.config.type) ? 1 : this.config.type === "hourly" ? 24 : 0;
			maxEntries = Math.max(1, Math.min(Math.round(parseFloat(this.config.maxNumberOfDays)) * daysFactor, maxEntriesLimit));
			maxNumberOfDays = Math.ceil(maxEntries / Math.max(1, daysFactor));
		}
		maxEntries = Math.max(1, Math.min(maxEntries, maxEntriesLimit));

		const params = {
			latitude: this.config.lat,
			longitude: this.config.lon,
			timeformat: "unixtime",
			timezone: "auto",
			past_days: this.config.pastDays ?? 0,
			daily: this.dailyParams,
			hourly: this.hourlyParams,
			temperature_unit: "celsius",
			windspeed_unit: "ms",
			precipitation_unit: "mm"
		};

		const now = new Date();
		const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + Math.max(0, Math.min(7, maxNumberOfDays)));

		params.start_date = startDate.toISOString().split("T")[0];

		switch (this.config.type) {
			case "hourly":
			case "daily":
			case "forecast":
				params.end_date = endDate.toISOString().split("T")[0];
				break;
			case "current":
				params.current_weather = true;
				params.end_date = params.start_date;
				break;
			default:
				return "";
		}

		return Object.keys(params)
			.filter((key) => !!params[key])
			.map((key) => {
				switch (key) {
					case "hourly":
					case "daily":
						return `${encodeURIComponent(key)}=${params[key].join(",")}`;
					default:
						return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
				}
			})
			.join("&");
	}

	#getUrl () {
		return `${this.config.apiBase}/forecast?${this.#getQueryParameters()}`;
	}

	#transposeDataMatrix (data) {
		return data.time.map((_, index) => Object.keys(data).reduce((row, key) => {
			const value = data[key][index];
			return {
				...row,
				// Convert Unix timestamps to Date objects
				// timezone: "auto" returns times already in location timezone
				[key]: ["time", "sunrise", "sunset"].includes(key) ? new Date(value * 1000) : value
			};
		}, {}));
	}

	#parseWeatherApiResponse (data) {
		const validByType = {
			current: data.current_weather && data.current_weather.time,
			hourly: data.hourly && data.hourly.time && Array.isArray(data.hourly.time) && data.hourly.time.length > 0,
			daily: data.daily && data.daily.time && Array.isArray(data.daily.time) && data.daily.time.length > 0
		};

		const type = ["daily", "forecast"].includes(this.config.type) ? "daily" : this.config.type;

		if (!validByType[type]) return null;

		if (type === "current" && !validByType.daily && !validByType.hourly) {
			return null;
		}

		for (const key of ["hourly", "daily"]) {
			if (typeof data[key] === "object") {
				data[key] = this.#transposeDataMatrix(data[key]);
			}
		}

		if (data.current_weather) {
			data.current_weather.time = new Date(data.current_weather.time * 1000);
		}

		return data;
	}

	#convertWeatherType (weathercode, isDayTime) {
		const weatherConditions = {
			0: "clear",
			1: "mainly-clear",
			2: "partly-cloudy",
			3: "overcast",
			45: "fog",
			48: "depositing-rime-fog",
			51: "drizzle-light-intensity",
			53: "drizzle-moderate-intensity",
			55: "drizzle-dense-intensity",
			56: "freezing-drizzle-light-intensity",
			57: "freezing-drizzle-dense-intensity",
			61: "rain-slight-intensity",
			63: "rain-moderate-intensity",
			65: "rain-heavy-intensity",
			66: "freezing-rain-light-intensity",
			67: "freezing-rain-heavy-intensity",
			71: "snow-fall-slight-intensity",
			73: "snow-fall-moderate-intensity",
			75: "snow-fall-heavy-intensity",
			77: "snow-grains",
			80: "rain-showers-slight",
			81: "rain-showers-moderate",
			82: "rain-showers-violent",
			85: "snow-showers-slight",
			86: "snow-showers-heavy",
			95: "thunderstorm",
			96: "thunderstorm-slight-hail",
			99: "thunderstorm-heavy-hail"
		};

		if (!(weathercode in weatherConditions)) return null;

		const mappings = {
			clear: isDayTime ? "day-sunny" : "night-clear",
			"mainly-clear": isDayTime ? "day-cloudy" : "night-alt-cloudy",
			"partly-cloudy": isDayTime ? "day-cloudy" : "night-alt-cloudy",
			overcast: isDayTime ? "day-sunny-overcast" : "night-alt-partly-cloudy",
			fog: isDayTime ? "day-fog" : "night-fog",
			"depositing-rime-fog": isDayTime ? "day-fog" : "night-fog",
			"drizzle-light-intensity": isDayTime ? "day-sprinkle" : "night-sprinkle",
			"rain-slight-intensity": isDayTime ? "day-sprinkle" : "night-sprinkle",
			"rain-showers-slight": isDayTime ? "day-sprinkle" : "night-sprinkle",
			"drizzle-moderate-intensity": isDayTime ? "day-showers" : "night-showers",
			"rain-moderate-intensity": isDayTime ? "day-showers" : "night-showers",
			"rain-showers-moderate": isDayTime ? "day-showers" : "night-showers",
			"drizzle-dense-intensity": isDayTime ? "day-thunderstorm" : "night-thunderstorm",
			"rain-heavy-intensity": isDayTime ? "day-thunderstorm" : "night-thunderstorm",
			"rain-showers-violent": isDayTime ? "day-thunderstorm" : "night-thunderstorm",
			"freezing-rain-light-intensity": isDayTime ? "day-rain-mix" : "night-rain-mix",
			"freezing-drizzle-light-intensity": "snowflake-cold",
			"freezing-drizzle-dense-intensity": "snowflake-cold",
			"snow-grains": isDayTime ? "day-sleet" : "night-sleet",
			"snow-fall-slight-intensity": isDayTime ? "day-snow-wind" : "night-snow-wind",
			"snow-fall-moderate-intensity": isDayTime ? "day-snow-wind" : "night-snow-wind",
			"snow-fall-heavy-intensity": isDayTime ? "day-snow-thunderstorm" : "night-snow-thunderstorm",
			"freezing-rain-heavy-intensity": isDayTime ? "day-snow-thunderstorm" : "night-snow-thunderstorm",
			"snow-showers-slight": isDayTime ? "day-rain-mix" : "night-rain-mix",
			"snow-showers-heavy": isDayTime ? "day-rain-mix" : "night-rain-mix",
			thunderstorm: isDayTime ? "day-thunderstorm" : "night-thunderstorm",
			"thunderstorm-slight-hail": isDayTime ? "day-sleet" : "night-sleet",
			"thunderstorm-heavy-hail": isDayTime ? "day-sleet-storm" : "night-sleet-storm"
		};

		return mappings[weatherConditions[`${weathercode}`]] || "na";
	}

	#isDayTime (date, sunrise, sunset) {
		const time = date.getTime();
		return time >= sunrise.getTime() && time < sunset.getTime();
	}

	#generateWeatherDayFromCurrentWeather (parsedData) {
		// Basic current weather data
		const current = {
			date: parsedData.current_weather.time,
			windSpeed: parsedData.current_weather.windspeed,
			windFromDirection: parsedData.current_weather.winddirection,
			temperature: parsedData.current_weather.temperature,
			weatherType: this.#convertWeatherType(parsedData.current_weather.weathercode, true)
		};

		// Add hourly data if available
		if (parsedData.hourly && parsedData.hourly.time) {
			const currentTime = parsedData.current_weather.time;
			const hourlyIndex = parsedData.hourly.time.findIndex((time) => time === currentTime);
			const h = hourlyIndex !== -1 ? hourlyIndex : 0;

			if (hourlyIndex === -1) {
				Log.warn("[weatherprovider.openmeteo] Could not find current time in hourly data, using index 0");
			}

			current.humidity = parsedData.hourly.relativehumidity_2m?.[h];
			current.feelsLikeTemp = parsedData.hourly.apparent_temperature?.[h];
			current.rain = parsedData.hourly.rain?.[h];
			current.snow = parsedData.hourly.snowfall?.[h] ? parsedData.hourly.snowfall[h] * 10 : undefined;
			current.precipitationAmount = parsedData.hourly.precipitation?.[h];
			current.precipitationProbability = parsedData.hourly.precipitation_probability?.[h];
			current.uvIndex = parsedData.hourly.uv_index?.[h];
		}

		// Add daily data if available
		if (parsedData.daily) {
			if (parsedData.daily.sunrise?.[0]) {
				current.sunrise = parsedData.daily.sunrise[0];
			}
			if (parsedData.daily.sunset?.[0]) {
				current.sunset = parsedData.daily.sunset[0];
				// Update weatherType with correct day/night status
				if (current.sunrise && current.sunset) {
					current.weatherType = this.#convertWeatherType(
						parsedData.current_weather.weathercode,
						this.#isDayTime(parsedData.current_weather.time, current.sunrise, current.sunset)
					);
				}
			}
			if (parsedData.daily.temperature_2m_min?.[0]) {
				current.minTemperature = parsedData.daily.temperature_2m_min[0];
			}
			if (parsedData.daily.temperature_2m_max?.[0]) {
				current.maxTemperature = parsedData.daily.temperature_2m_max[0];
			}
		}

		return current;
	}

	#generateWeatherObjectsFromForecast (parsedData) {
		return parsedData.daily.map((weather) => ({
			date: weather.time,
			windSpeed: weather.windspeed_10m_max,
			windFromDirection: weather.winddirection_10m_dominant,
			sunrise: weather.sunrise,
			sunset: weather.sunset,
			temperature: parseFloat((weather.temperature_2m_max + weather.temperature_2m_min) / 2),
			minTemperature: parseFloat(weather.temperature_2m_min),
			maxTemperature: parseFloat(weather.temperature_2m_max),
			weatherType: this.#convertWeatherType(weather.weathercode, true),
			rain: parseFloat(weather.rain_sum),
			snow: parseFloat(weather.snowfall_sum * 10),
			precipitationAmount: parseFloat(weather.precipitation_sum),
			precipitationProbability: parseFloat(weather.precipitation_hours * 100 / 24),
			uvIndex: parseFloat(weather.uv_index_max)
		}));
	}

	#generateWeatherObjectsFromHourly (parsedData) {
		const hours = [];
		const now = new Date();

		parsedData.hourly.forEach((weather, i) => {
			if ((hours.length === 0 && weather.time <= now) || hours.length >= this.config.maxEntries) {
				return;
			}

			const h = Math.ceil((i + 1) / 24) - 1;
			const hourlyWeather = {
				date: weather.time,
				windSpeed: weather.windspeed_10m,
				windFromDirection: weather.winddirection_10m,
				sunrise: parsedData.daily[h].sunrise,
				sunset: parsedData.daily[h].sunset,
				temperature: parseFloat(weather.temperature_2m),
				minTemperature: parseFloat(parsedData.daily[h].temperature_2m_min),
				maxTemperature: parseFloat(parsedData.daily[h].temperature_2m_max),
				weatherType: this.#convertWeatherType(
					weather.weathercode,
					this.#isDayTime(weather.time, parsedData.daily[h].sunrise, parsedData.daily[h].sunset)
				),
				humidity: parseFloat(weather.relativehumidity_2m),
				rain: parseFloat(weather.rain),
				snow: parseFloat(weather.snowfall * 10),
				precipitationAmount: parseFloat(weather.precipitation),
				precipitationProbability: parseFloat(weather.precipitation_probability),
				uvIndex: parseFloat(weather.uv_index)
			};

			hours.push(hourlyWeather);
		});

		return hours;
	}
}

module.exports = OpenMeteoProvider;
