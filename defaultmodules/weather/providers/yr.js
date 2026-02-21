const Log = require("logger");
const { formatTimezoneOffset, getDateString, validateCoordinates } = require("../provider-utils");
const HTTPFetcher = require("#http_fetcher");

/**
 * Server-side weather provider for Yr.no (Norwegian Meteorological Institute)
 * Terms of service: https://developer.yr.no/doc/TermsOfService/
 *
 * Note: Minimum update interval is 10 minutes (600000 ms) per API terms
 */
class YrProvider {
	constructor (config) {
		this.config = {
			apiBase: "https://api.met.no/weatherapi",
			forecastApiVersion: "2.0",
			sunriseApiVersion: "3.0",
			altitude: 0,
			lat: 0,
			lon: 0,
			currentForecastHours: 1, // 1, 6 or 12
			type: "current",
			updateInterval: 10 * 60 * 1000, // 10 minutes minimum
			...config
		};

		// Enforce 10 minute minimum per API terms
		if (this.config.updateInterval < 600000) {
			Log.warn("[weatherprovider.yr] Minimum update interval is 10 minutes (600000 ms). Adjusting configuration.");
			this.config.updateInterval = 600000;
		}

		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
		this.locationName = null;

		// Cache for sunrise/sunset data
		this.stellarData = null;
		this.stellarDataDate = null;

		// Cache for weather data (If-Modified-Since support)
		this.weatherCache = {
			data: null,
			lastModified: null,
			expires: null
		};
	}

	async initialize () {
		// Yr.no requires max 4 decimal places
		validateCoordinates(this.config, 4);
		await this.#fetchStellarData();
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

	async #fetchStellarData () {
		const today = getDateString(new Date());

		// Check if we already have today's data
		if (this.stellarDataDate === today && this.stellarData) {
			return;
		}

		const url = this.#getSunriseUrl();

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const response = await fetch(url, {
				headers: {
					"User-Agent": "MagicMirror",
					Accept: "application/json"
				},
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				Log.warn(`[weatherprovider.yr] Could not fetch stellar data: HTTP ${response.status}`);
				this.stellarDataDate = today;
			}
		} catch (error) {
			Log.warn("[weatherprovider.yr] Failed to fetch stellar data:", error);
		}
	}

	#initializeFetcher () {
		const url = this.#getForecastUrl();

		const headers = {
			"User-Agent": "MagicMirror",
			Accept: "application/json"
		};

		// Add If-Modified-Since header if we have cached data
		if (this.weatherCache.lastModified) {
			headers["If-Modified-Since"] = this.weatherCache.lastModified;
		}

		this.fetcher = new HTTPFetcher(url, {
			reloadInterval: this.config.updateInterval,
			headers,
			logContext: "weatherprovider.yr"
		});

		this.fetcher.on("response", async (response) => {
			try {
				// Handle 304 Not Modified - use cached data
				if (response.status === 304) {
					Log.log("[weatherprovider.yr] Data not modified, using cache");
					if (this.weatherCache.data) {
						this.#handleResponse(this.weatherCache.data, true);
					}
					return;
				}

				const data = await response.json();

				// Store cache headers
				const lastModified = response.headers.get("Last-Modified");
				const expires = response.headers.get("Expires");

				if (lastModified) {
					this.weatherCache.lastModified = lastModified;
				}
				if (expires) {
					this.weatherCache.expires = expires;
				}
				this.weatherCache.data = data;

				// Update headers for next request
				if (lastModified && this.fetcher) {
					this.fetcher.customHeaders["If-Modified-Since"] = lastModified;
				}

				this.#handleResponse(data, false);
			} catch (error) {
				Log.error("[weatherprovider.yr] Failed to parse JSON:", error);
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

	async #handleResponse (data, fromCache = false) {
		try {
			if (!data.properties || !data.properties.timeseries) {
				throw new Error("Invalid weather data");
			}

			// Refresh stellar data if needed (new day or using cached weather data)
			if (fromCache) {
				await this.#fetchStellarData();
			}

			let weatherData;

			switch (this.config.type) {
				case "current":
					weatherData = this.#generateCurrentWeather(data);
					break;
				case "forecast":
				case "daily":
					weatherData = this.#generateForecast(data);
					break;
				case "hourly":
					weatherData = this.#generateHourly(data);
					break;
				default:
					throw new Error(`Unknown weather type: ${this.config.type}`);
			}

			if (this.onDataCallback) {
				this.onDataCallback(weatherData);
			}
		} catch (error) {
			Log.error("[weatherprovider.yr] Error processing weather data:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: error.message,
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
		}
	}

	#generateCurrentWeather (data) {
		const now = new Date();
		const timeseries = data.properties.timeseries;

		// Find closest forecast in the past
		let forecast = timeseries[0];
		let closestDiff = Math.abs(now - new Date(forecast.time));

		for (const entry of timeseries) {
			const entryTime = new Date(entry.time);
			const diff = now - entryTime;

			if (diff > 0 && diff < closestDiff) {
				closestDiff = diff;
				forecast = entry;
			}
		}

		const forecastXHours = this.#getForecastForXHours(forecast.data);
		const stellarInfo = this.#getStellarInfoForDate(new Date(forecast.time));

		const current = {};
		current.date = new Date(forecast.time);
		current.temperature = forecast.data.instant.details.air_temperature;
		current.windSpeed = forecast.data.instant.details.wind_speed;
		current.windFromDirection = forecast.data.instant.details.wind_from_direction;
		current.humidity = forecast.data.instant.details.relative_humidity;
		current.weatherType = this.#convertWeatherType(
			forecastXHours.summary?.symbol_code,
			stellarInfo ? this.#isDayTime(current.date, stellarInfo) : true
		);
		current.precipitationAmount = forecastXHours.details?.precipitation_amount;
		current.precipitationProbability = forecastXHours.details?.probability_of_precipitation;
		current.minTemperature = forecastXHours.details?.air_temperature_min;
		current.maxTemperature = forecastXHours.details?.air_temperature_max;

		if (stellarInfo) {
			current.sunrise = new Date(stellarInfo.sunrise.time);
			current.sunset = new Date(stellarInfo.sunset.time);
		}

		return current;
	}

	#generateForecast (data) {
		const days = [];
		const timeseries = data.properties.timeseries;
		let currentDay = null;
		let dayData = null;

		for (const entry of timeseries) {
			const date = new Date(entry.time);
			const dateStr = getDateString(date);

			if (currentDay !== dateStr) {
				if (dayData) {
					days.push(dayData);
				}

				const forecast6h = entry.data.next_6_hours || entry.data.next_12_hours;
				const stellarInfo = this.#getStellarInfoForDate(date);

				dayData = {
					date: date,
					minTemperature: forecast6h?.details?.air_temperature_min,
					maxTemperature: forecast6h?.details?.air_temperature_max,
					precipitationAmount: forecast6h?.details?.precipitation_amount,
					precipitationProbability: forecast6h?.details?.probability_of_precipitation,
					weatherType: this.#convertWeatherType(forecast6h?.summary?.symbol_code, true)
				};

				if (stellarInfo) {
					dayData.sunrise = new Date(stellarInfo.sunrise.time);
					dayData.sunset = new Date(stellarInfo.sunset.time);
				}

				currentDay = dateStr;
			}
		}

		if (dayData) {
			days.push(dayData);
		}

		return days;
	}

	#generateHourly (data) {
		const hours = [];
		const timeseries = data.properties.timeseries;

		for (const entry of timeseries) {
			const forecast1h = entry.data.next_1_hours;
			if (!forecast1h) continue;

			const date = new Date(entry.time);
			const stellarInfo = this.#getStellarInfoForDate(date);

			const hourly = {
				date: date,
				temperature: entry.data.instant.details.air_temperature,
				windSpeed: entry.data.instant.details.wind_speed,
				windFromDirection: entry.data.instant.details.wind_from_direction,
				humidity: entry.data.instant.details.relative_humidity,
				precipitationAmount: forecast1h.details?.precipitation_amount,
				precipitationProbability: forecast1h.details?.probability_of_precipitation,
				weatherType: this.#convertWeatherType(
					forecast1h.summary?.symbol_code,
					stellarInfo ? this.#isDayTime(date, stellarInfo) : true
				)
			};

			hours.push(hourly);
		}

		return hours;
	}

	#getForecastForXHours (data) {
		const hours = this.config.currentForecastHours;

		if (hours === 12 && data.next_12_hours) {
			return data.next_12_hours;
		} else if (hours === 6 && data.next_6_hours) {
			return data.next_6_hours;
		} else if (data.next_1_hours) {
			return data.next_1_hours;
		}

		return data.next_6_hours || data.next_12_hours || data.next_1_hours || {};
	}

	#getStellarInfoForDate (date) {
		if (!this.stellarData) return null;

		const dateStr = getDateString(date);

		for (const day of this.stellarData) {
			const dayDate = day.date.split("T")[0];
			if (dayDate === dateStr) {
				return day;
			}
		}

		return null;
	}

	#isDayTime (date, stellarInfo) {
		if (!stellarInfo || !stellarInfo.sunrise || !stellarInfo.sunset) {
			return true;
		}

		const sunrise = new Date(stellarInfo.sunrise.time);
		const sunset = new Date(stellarInfo.sunset.time);

		return date >= sunrise && date < sunset;
	}

	#convertWeatherType (symbolCode, isDayTime) {
		if (!symbolCode) return null;

		// Yr.no uses symbol codes like "clearsky_day", "partlycloudy_night", etc.
		const symbol = symbolCode.replace(/_day|_night/g, "");

		const mappings = {
			clearsky: isDayTime ? "day-sunny" : "night-clear",
			fair: isDayTime ? "day-sunny" : "night-clear",
			partlycloudy: isDayTime ? "day-cloudy" : "night-cloudy",
			cloudy: "cloudy",
			fog: "fog",
			lightrainshowers: isDayTime ? "day-showers" : "night-showers",
			rainshowers: isDayTime ? "showers" : "night-showers",
			heavyrainshowers: isDayTime ? "day-rain" : "night-rain",
			lightrain: isDayTime ? "day-sprinkle" : "night-sprinkle",
			rain: isDayTime ? "rain" : "night-rain",
			heavyrain: isDayTime ? "rain" : "night-rain",
			lightsleetshowers: isDayTime ? "day-sleet" : "night-sleet",
			sleetshowers: isDayTime ? "sleet" : "night-sleet",
			heavysleetshowers: isDayTime ? "sleet" : "night-sleet",
			lightsleet: isDayTime ? "day-sleet" : "night-sleet",
			sleet: "sleet",
			heavysleet: "sleet",
			lightsnowshowers: isDayTime ? "day-snow" : "night-snow",
			snowshowers: isDayTime ? "snow" : "night-snow",
			heavysnowshowers: isDayTime ? "snow" : "night-snow",
			lightsnow: isDayTime ? "day-snow" : "night-snow",
			snow: "snow",
			heavysnow: "snow",
			lightrainandthunder: isDayTime ? "day-thunderstorm" : "night-thunderstorm",
			rainandthunder: isDayTime ? "thunderstorm" : "night-thunderstorm",
			heavyrainandthunder: isDayTime ? "thunderstorm" : "night-thunderstorm",
			lightsleetandthunder: isDayTime ? "day-sleet-storm" : "night-sleet-storm",
			sleetandthunder: isDayTime ? "day-sleet-storm" : "night-sleet-storm",
			heavysleetandthunder: isDayTime ? "day-sleet-storm" : "night-sleet-storm",
			lightsnowandthunder: isDayTime ? "day-snow-thunderstorm" : "night-snow-thunderstorm",
			snowandthunder: isDayTime ? "day-snow-thunderstorm" : "night-snow-thunderstorm",
			heavysnowandthunder: isDayTime ? "day-snow-thunderstorm" : "night-snow-thunderstorm"
		};

		return mappings[symbol] || null;
	}

	#getForecastUrl () {
		const { lat, lon, altitude } = this.config;
		return `${this.config.apiBase}/locationforecast/${this.config.forecastApiVersion}/complete?altitude=${altitude}&lat=${lat}&lon=${lon}`;
	}

	#getSunriseUrl () {
		const { lat, lon } = this.config;
		const today = getDateString(new Date());
		const offset = formatTimezoneOffset(-new Date().getTimezoneOffset());
		return `${this.config.apiBase}/sunrise/${this.config.sunriseApiVersion}/sun?lat=${lat}&lon=${lon}&date=${today}&offset=${offset}`;
	}
}

module.exports = YrProvider;
