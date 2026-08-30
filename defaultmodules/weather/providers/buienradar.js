const Log = require("logger");
const HTTPFetcher = require("#http_fetcher");

const BUIENRADAR_API_BASE = "https://forecast.buienradar.nl/2.0/forecast";
const ERROR_TRANSLATION_KEY = "MODULE_ERROR_UNSPECIFIED";
const TIMESTAMP_HAS_TIME_ZONE = /[zZ]|[+-]\d{2}:?\d{2}$/;

// Mapping from Buienradar icon code to weather-icons class names (https://erikflowers.github.io/weather-icons/).
// Icon filenames use the Buienradar code: https://cdn.buienradar.nl/resources/images/icons/weather/30x30/a.png
const WEATHER_ICON_MAP = {
	a: "day-sunny",
	aa: "night-clear",
	b: "day-cloudy",
	bb: "night-alt-cloudy",
	c: "cloudy",
	cc: "cloudy",
	d: "day-fog",
	dd: "night-fog",
	f: "day-sprinkle",
	ff: "night-alt-sprinkle",
	g: "day-storm-showers",
	gg: "night-alt-storm-showers",
	h: "day-rain",
	hh: "night-alt-rain",
	i: "day-rain-mix",
	ii: "night-alt-rain-mix",
	j: "day-cloudy",
	jj: "night-alt-cloudy",
	k: "day-showers",
	kk: "night-alt-showers",
	l: "showers",
	ll: "showers",
	m: "sprinkle",
	mm: "sprinkle",
	n: "day-haze",
	nn: "night-fog",
	o: "day-cloudy",
	oo: "night-alt-cloudy",
	p: "cloudy",
	pp: "cloudy",
	q: "showers",
	qq: "showers",
	r: "day-cloudy",
	rr: "night-alt-cloudy",
	s: "thunderstorm",
	ss: "thunderstorm",
	t: "snow",
	tt: "snow",
	u: "day-snow",
	uu: "night-alt-snow",
	v: "snow",
	vv: "snow",
	w: "rain-mix",
	ww: "rain-mix"
};

/**
 * Server-side weather provider for Buienradar
 * Netherlands/Belgium only, metric system, no API key required
 * see https://buienradar.nl
 */
class BuienradarProvider {
	constructor (config) {
		this.config = {
			apiBase: BUIENRADAR_API_BASE,
			locationId: null,
			type: "current",
			maxEntries: 5,
			updateInterval: 10 * 60 * 1000,
			...config
		};

		this.locationName = null;
		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
	}

	initialize () {
		if (!this.config.locationId) {
			Log.error("[buienradar] No locationId configured");
			this.#sendErrorCallback("Buienradar locationId required. See https://www.buienradar.nl/overbuienradar/gratis-weerdata");
			return;
		}

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

	#initializeFetcher () {
		this.fetcher = new HTTPFetcher(this.#getUrl(), {
			reloadInterval: this.config.updateInterval,
			headers: { "Cache-Control": "no-cache" },
			logContext: "weatherprovider.buienradar"
		});

		this.fetcher.on("response", async (response) => {
			if (response.status === 304) return;
			try {
				const data = await response.json();
				this.#handleResponse(data);
			} catch (error) {
				Log.error("[buienradar] Failed to parse JSON:", error);
				this.#sendErrorCallback("Failed to parse API response");
			}
		});

		this.fetcher.on("error", (errorInfo) => {
			if (this.onErrorCallback) {
				this.onErrorCallback(errorInfo);
			}
		});
	}

	#handleResponse (data) {
		try {
			if (!Array.isArray(data?.days) || data.days.length === 0) {
				throw new Error("Invalid API response");
			}

			this.#setLocationName(data.location);

			let weatherData;
			switch (this.config.type) {
				case "current":
					weatherData = this.#generateCurrentWeather(data.days[0]);
					break;
				case "forecast":
				case "daily":
					weatherData = this.#generateDailyForecast(data.days);
					break;
				case "hourly":
					weatherData = this.#generateHourlyForecast(data.days);
					break;
				default:
					throw new Error(`Unknown weather type: ${this.config.type}`);
			}

			if (this.onDataCallback && weatherData) {
				this.onDataCallback(weatherData);
			}
		} catch (error) {
			Log.error("[buienradar] Error processing weather data:", error);
			this.#sendErrorCallback(error.message);
		}
	}

	#sendErrorCallback (message) {
		if (this.onErrorCallback) {
			this.onErrorCallback({
				message,
				translationKey: ERROR_TRANSLATION_KEY
			});
		}
	}

	#setLocationName (location) {
		if (location?.name) {
			this.locationName = location.name;
		}
	}

	#generateCurrentWeather (day) {
		const closestHour = this.#getClosestHour(day.hours ?? []);
		const weather = this.#parseHour(closestHour);

		const sunrise = this.#parseDate(day.sunrise);
		if (sunrise) weather.sunrise = sunrise;

		const sunset = this.#parseDate(day.sunset);
		if (sunset) weather.sunset = sunset;

		const minTemperature = this.#parseNumber(day.mintemp);
		if (minTemperature !== null) weather.minTemperature = minTemperature;

		const maxTemperature = this.#parseNumber(day.maxtemp);
		if (maxTemperature !== null) weather.maxTemperature = maxTemperature;

		return weather;
	}

	#generateDailyForecast (days) {
		return days
			.slice(0, this.config.maxEntries)
			.map((day) => this.#parseDay(day));
	}

	#generateHourlyForecast (days) {
		const hours = [];

		for (const day of days) {
			for (const hour of day.hours ?? []) {
				hours.push(this.#parseHour(hour));
				if (hours.length >= this.config.maxEntries) {
					return hours;
				}
			}
		}

		return hours;
	}

	#parseDay (day) {
		const weather = {};

		const date = this.#parseDate(day.date);
		if (date) weather.date = date;

		const minTemperature = this.#parseNumber(day.mintemp);
		if (minTemperature !== null) weather.minTemperature = minTemperature;

		const maxTemperature = this.#parseNumber(day.maxtemp);
		if (maxTemperature !== null) weather.maxTemperature = maxTemperature;

		const humidity = this.#parseNumber(day.humidity);
		if (humidity !== null) weather.humidity = humidity;

		const windSpeed = this.#parseNumber(day.windspeedms);
		if (windSpeed !== null) weather.windSpeed = windSpeed;

		const windFromDirection = this.#parseNumber(day.winddirectiondegrees);
		if (windFromDirection !== null) weather.windFromDirection = windFromDirection;

		this.#applyPrecipitation(weather, day);

		const sunrise = this.#parseDate(day.sunrise);
		if (sunrise) weather.sunrise = sunrise;

		const sunset = this.#parseDate(day.sunset);
		if (sunset) weather.sunset = sunset;

		weather.weatherType = this.#convertWeatherType(day.iconcode);

		return weather;
	}

	#parseHour (hour) {
		const weather = {};

		const date = this.#parseDate(hour.datetime);
		if (date) weather.date = date;

		const temperature = this.#parseNumber(hour.temperature);
		if (temperature !== null) weather.temperature = temperature;

		const feelsLikeTemp = this.#parseNumber(hour.feeltemperature);
		if (feelsLikeTemp !== null) weather.feelsLikeTemp = feelsLikeTemp;

		const humidity = this.#parseNumber(hour.humidity);
		if (humidity !== null) weather.humidity = humidity;

		const windSpeed = this.#parseNumber(hour.windspeedms);
		if (windSpeed !== null) weather.windSpeed = windSpeed;

		const windFromDirection = this.#parseNumber(hour.winddirectiondegrees);
		if (windFromDirection !== null) weather.windFromDirection = windFromDirection;

		this.#applyPrecipitation(weather, hour);

		weather.weatherType = this.#convertWeatherType(hour.iconcode);

		return weather;
	}

	#applyPrecipitation (weather, source) {
		const precipitationAmount = this.#parseNumber(source.precipitationmm);
		if (precipitationAmount !== null) {
			weather.precipitationAmount = precipitationAmount;
			weather.precipitationUnits = "mm";
		}

		const precipitationProbability = this.#parseNumber(source.precipitation);
		if (precipitationProbability !== null) {
			weather.precipitationProbability = precipitationProbability;
		}
	}

	#getClosestHour (hours) {
		if (hours.length === 0) {
			return {};
		}

		const now = Date.now();
		let closest = hours[0];
		let closestDiff = Number.POSITIVE_INFINITY;

		for (const hour of hours) {
			const date = this.#parseDate(hour.datetime);
			if (!date) continue;

			const diff = Math.abs(date.getTime() - now);
			if (diff < closestDiff) {
				closestDiff = diff;
				closest = hour;
			}
		}

		return closest;
	}

	#getUrl () {
		const now = new Date();
		const year = now.getUTCFullYear();
		const month = `${now.getUTCMonth() + 1}`.padStart(2, "0");
		const day = `${now.getUTCDate()}`.padStart(2, "0");
		const hours = `${now.getUTCHours()}`.padStart(2, "0");
		const minutes = `${now.getUTCMinutes()}`.padStart(2, "0");
		const cacheBust = `${year}${month}${day}${hours}${minutes}`;
		const params = new URLSearchParams({ btc: cacheBust });

		return `${this.config.apiBase}/${this.config.locationId}?${params}`;
	}

	#parseDate (value) {
		if (!value) return null;

		const text = `${value}`;
		const date = new Date(TIMESTAMP_HAS_TIME_ZONE.test(text) ? text : `${text}Z`);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	#parseNumber (value) {
		const number = parseFloat(value);
		return Number.isFinite(number) ? number : null;
	}

	#convertWeatherType (icon) {
		if (!icon) return null;
		return WEATHER_ICON_MAP[`${icon}`.toLowerCase()] ?? null;
	}
}

module.exports = BuienradarProvider;
