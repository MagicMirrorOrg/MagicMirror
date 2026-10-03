const Log = require("logger");
const { convertKmhToMs, getDateString, getSunTimes, isDayTime } = require("../provider-utils");
const WeatherProvider = require("../weatherprovider");

// https://www.bigdatacloud.com/docs/api/free-reverse-geocode-to-city-api
const GEOCODE_BASE = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const BRIGHTSKY_BASE = "https://api.brightsky.dev";
const ERROR_TRANSLATION_KEY = "MODULE_ERROR_UNSPECIFIED";

// Bright Sky icon aliases, see https://brightsky.dev/docs/#/operations/getWeather
const ICON_MAP = {
	"clear-day": ["day-sunny", "night-clear"],
	"clear-night": ["day-sunny", "night-clear"],
	"partly-cloudy-day": ["day-cloudy", "night-alt-cloudy"],
	"partly-cloudy-night": ["day-cloudy", "night-alt-cloudy"],
	cloudy: ["cloudy", "cloudy"],
	fog: ["day-fog", "night-fog"],
	wind: ["strong-wind", "strong-wind"],
	rain: ["day-rain", "night-alt-rain"],
	sleet: ["day-sleet", "night-alt-sleet"],
	snow: ["day-snow", "night-alt-snow"],
	hail: ["day-hail", "night-alt-hail"],
	thunderstorm: ["day-thunderstorm", "night-alt-thunderstorm"]
};

/**
 * Server-side weather provider for Bright Sky, a free JSON API for the open
 * data of the German Meteorological Service (DWD): station observations and
 * MOSMIX forecasts. No API key required. Best coverage in Germany.
 * see https://brightsky.dev/
 */
class BrightSkyProvider extends WeatherProvider {
	constructor (config) {
		super();
		this.config = {
			apiBase: BRIGHTSKY_BASE,
			lat: 0,
			lon: 0,
			type: "current",
			maxNumberOfDays: 5,
			maxEntries: 5,
			updateInterval: 10 * 60 * 1000,
			...config
		};
	}

	async initialize () {
		if (!Number.isFinite(this.config.lat) || !Number.isFinite(this.config.lon)) {
			Log.error("[brightsky] Latitude and longitude are required");
			this.#sendError("Latitude and longitude are required");
			return;
		}

		await this.#fetchLocation();
		this._createJSONFetcher({
			urlFactory: () => this.#getUrl(),
			reloadInterval: this.config.updateInterval,
			logContext: "weatherprovider.brightsky"
		}, (data) => this.#handleResponse(data));
	}

	async #fetchLocation () {
		const params = new URLSearchParams({
			latitude: this.config.lat,
			longitude: this.config.lon,
			localityLanguage: this.config.lang || "en"
		});

		try {
			const response = await fetch(`${GEOCODE_BASE}?${params}`, { signal: AbortSignal.timeout(10000) });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const data = await response.json();
			if (data?.city) {
				this.locationName = data.principalSubdivisionCode ? `${data.city}, ${data.principalSubdivisionCode}` : data.city;
			}
		} catch (error) {
			Log.debug("[brightsky] Could not load location data:", error.message);
		}
	}

	/**
	 * Builds the request URL. Called before every fetch, so the requested date
	 * range always starts today, even after midnight.
	 * @returns {string} The URL for the configured weather type
	 */
	#getUrl () {
		const params = new URLSearchParams({ lat: this.config.lat, lon: this.config.lon });

		if (this.config.type === "current") {
			return `${this.config.apiBase}/current_weather?${params}`;
		}

		const days = this.config.type === "hourly"
			? Math.ceil(Math.min(this.config.maxEntries, 48) / 24) + 1
			: this.config.maxNumberOfDays + 1;
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		const end = new Date(start);
		end.setDate(end.getDate() + days);

		params.set("date", start.toISOString());
		params.set("last_date", end.toISOString());
		return `${this.config.apiBase}/weather?${params}`;
	}

	async #handleResponse (data) {
		try {
			let weatherData;
			switch (this.config.type) {
				case "current":
					if (!data?.weather) throw new Error("Invalid API response");
					weatherData = await this.#generateCurrentWeather(data.weather);
					break;
				case "forecast":
				case "daily":
					if (!Array.isArray(data?.weather)) throw new Error("Invalid API response");
					weatherData = this.#generateDailyForecast(data.weather);
					break;
				case "hourly":
					if (!Array.isArray(data?.weather)) throw new Error("Invalid API response");
					weatherData = this.#generateHourlyForecast(data.weather);
					break;
				default:
					throw new Error(`Unknown weather type: ${this.config.type}`);
			}

			this.onDataCallback?.(weatherData);
		} catch (error) {
			Log.error("[brightsky] Error processing weather data:", error);
			this.#sendError(error.message);
		}
	}

	#sendError (message) {
		this.onErrorCallback?.({ message, translationKey: ERROR_TRANSLATION_KEY });
	}

	async #generateCurrentWeather (record) {
		const date = new Date(record.timestamp);
		const { sunrise, sunset } = getSunTimes(date, this.config.lat, this.config.lon);
		const precipitation = record.precipitation_60 ?? record.precipitation_10;

		return {
			date,
			sunrise,
			sunset,
			temperature: record.temperature,
			humidity: record.relative_humidity,
			windSpeed: this.#toMs(record.wind_speed_60 ?? record.wind_speed_10),
			windFromDirection: record.wind_direction_60 ?? record.wind_direction_10,
			weatherType: this.#convertWeatherType(record.icon, isDayTime(date, sunrise, sunset)),
			precipitationAmount: precipitation,
			precipitationUnits: precipitation != null ? "mm" : null,
			sunshineHours: this.config.showSunshineHours ? await this.#fetchSunshineToday() : null
		};
	}

	/**
	 * Sums up the sunshine of today's records (observations and forecast).
	 * @returns {Promise<number|null>} Sunshine hours of today, null if unavailable
	 */
	async #fetchSunshineToday () {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		const end = new Date(start);
		end.setDate(end.getDate() + 1);
		const params = new URLSearchParams({
			lat: this.config.lat,
			lon: this.config.lon,
			date: start.toISOString(),
			last_date: end.toISOString()
		});

		try {
			const response = await fetch(`${this.config.apiBase}/weather?${params}`, { signal: AbortSignal.timeout(10000) });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const data = await response.json();
			const today = getDateString(start);
			const records = (data?.weather ?? []).filter((record) => this.#dayOf(record) === today);
			const minutes = this.#sum(records, "sunshine");
			return minutes === null ? null : minutes / 60;
		} catch (error) {
			Log.debug("[brightsky] Could not load sunshine data:", error.message);
			return null;
		}
	}

	/**
	 * Returns the local calendar day a record belongs to. Records describe the
	 * previous hour, so a record at 00:00 still belongs to the previous day.
	 * @param {object} record A Bright Sky weather record
	 * @returns {string} Date string in YYYY-MM-DD format
	 */
	#dayOf (record) {
		return getDateString(new Date(new Date(record.timestamp).getTime() - 60 * 60 * 1000));
	}

	#generateHourlyForecast (records) {
		const now = new Date();

		return records
			.map((record) => ({ record, date: new Date(record.timestamp) }))
			.filter(({ date }) => date > now)
			.map(({ record, date }) => {
				const { sunrise, sunset } = getSunTimes(date, this.config.lat, this.config.lon);
				return {
					date,
					sunrise,
					sunset,
					temperature: record.temperature,
					humidity: record.relative_humidity,
					windSpeed: this.#toMs(record.wind_speed),
					windFromDirection: record.wind_direction,
					weatherType: this.#convertWeatherType(record.icon, isDayTime(date, sunrise, sunset)),
					precipitationAmount: record.precipitation,
					precipitationUnits: record.precipitation != null ? "mm" : null,
					precipitationProbability: record.precipitation_probability
				};
			});
	}

	/**
	 * Aggregates the hourly records into calendar days (local time). Records
	 * describe the previous hour, so a record at 00:00 still belongs to the
	 * previous day. Days are kept complete, including past hours of today.
	 * @param {object[]} records Hourly Bright Sky weather records
	 * @returns {object[]} One weather object per day, starting today
	 */
	#generateDailyForecast (records) {
		const today = getDateString(new Date());
		const days = new Map();

		for (const record of records) {
			const key = this.#dayOf(record);
			if (key < today) continue;

			if (!days.has(key)) days.set(key, []);
			days.get(key).push(record);
		}

		return [...days.entries()]
			.slice(0, this.config.maxNumberOfDays)
			.map(([key, dayRecords]) => this.#aggregateDay(key, dayRecords))
			.filter((day) => day !== null);
	}

	#aggregateDay (key, records) {
		const temperatures = records.map((record) => record.temperature).filter(Number.isFinite);
		if (temperatures.length === 0) return null;

		const [year, month, day] = key.split("-").map(Number);
		const date = new Date(year, month - 1, day);
		const { sunrise, sunset } = getSunTimes(new Date(year, month - 1, day, 12), this.config.lat, this.config.lon);
		const daytimeRecords = records.filter((record) => isDayTime(new Date(record.timestamp), sunrise, sunset));
		const precipitation = this.#sum(records, "precipitation");
		const sunshineMinutes = this.#sum(records, "sunshine");
		const probabilities = records.map((record) => record.precipitation_probability).filter(Number.isFinite);
		const windSpeeds = records.map((record) => record.wind_speed).filter(Number.isFinite);

		return {
			date,
			sunrise,
			sunset,
			minTemperature: Math.min(...temperatures),
			maxTemperature: Math.max(...temperatures),
			temperature: (Math.min(...temperatures) + Math.max(...temperatures)) / 2,
			weatherType: this.#convertWeatherType(this.#mostFrequentIcon(daytimeRecords.length > 0 ? daytimeRecords : records), true),
			windSpeed: windSpeeds.length > 0 ? this.#toMs(Math.max(...windSpeeds)) : null,
			precipitationAmount: precipitation,
			precipitationUnits: precipitation != null ? "mm" : null,
			precipitationProbability: probabilities.length > 0 ? Math.max(...probabilities) : null,
			sunshineHours: sunshineMinutes === null ? null : sunshineMinutes / 60
		};
	}

	#sum (records, field) {
		const values = records.map((record) => record[field]).filter(Number.isFinite);
		return values.length > 0 ? values.reduce((total, value) => total + value, 0) : null;
	}

	#mostFrequentIcon (records) {
		const counts = new Map();
		for (const { icon } of records) {
			if (icon) counts.set(icon, (counts.get(icon) ?? 0) + 1);
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
	}

	#toMs (kmh) {
		return Number.isFinite(kmh) ? convertKmhToMs(kmh) : null;
	}

	#convertWeatherType (icon, dayTime) {
		const mapping = ICON_MAP[icon];
		if (!mapping) return null;
		return dayTime ? mapping[0] : mapping[1];
	}
}

module.exports = BrightSkyProvider;
