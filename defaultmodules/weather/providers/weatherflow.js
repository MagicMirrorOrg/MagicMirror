const Log = require("logger");
const { convertKmhToMs } = require("../provider-utils");
const HTTPFetcher = require("#http_fetcher");

/**
 * WeatherFlow weather provider
 * This class is a provider for WeatherFlow personal weather stations.
 * Note that the WeatherFlow API does not provide snowfall.
 */
class WeatherFlowProvider {
	/**
	 * @param {object} config - Provider configuration
	 */
	constructor (config) {
		this.config = config;
		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
	}

	/**
	 * Set the callbacks for data and errors
	 * @param {(data: object) => void} onDataCallback - Called when new data is available
	 * @param {(error: object) => void} onErrorCallback - Called when an error occurs
	 */
	setCallbacks (onDataCallback, onErrorCallback) {
		this.onDataCallback = onDataCallback;
		this.onErrorCallback = onErrorCallback;
	}

	/**
	 * Initialize the provider
	 */
	async initialize () {
		if (!this.config.token || this.config.token === "YOUR_API_TOKEN_HERE") {
			Log.error("[weatherflow] No API token configured. Get one at https://tempestwx.com/");
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: "WeatherFlow API token required. Get one at https://tempestwx.com/",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
			return;
		}

		if (!this.config.stationid) {
			Log.error("[weatherflow] No station ID configured");
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: "WeatherFlow station ID required",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
			return;
		}

		this.initializeFetcher();
	}

	/**
	 * Initialize the HTTP fetcher
	 */
	initializeFetcher () {
		const url = this.getUrl();

		this.fetcher = new HTTPFetcher(url, {
			reloadInterval: this.config.updateInterval,
			headers: {
				"Cache-Control": "no-cache",
				Accept: "application/json"
			},
			logContext: "weatherprovider.weatherflow"
		});

		this.fetcher.on("response", async (response) => {
			try {
				const data = await response.json();
				const processed = this.processData(data);
				this.onDataCallback(processed);
			} catch (error) {
				Log.error("[weatherflow] Failed to parse JSON:", error);
			}
		});

		this.fetcher.on("error", (errorInfo) => {
			// HTTPFetcher already logged the error with logContext
			if (this.onErrorCallback) {
				this.onErrorCallback(errorInfo);
			}
		});
	}

	/**
	 * Generate the URL for API requests
	 * @returns {string} The API URL
	 */
	getUrl () {
		const base = this.config.apiBase || "https://swd.weatherflow.com/swd/rest/";
		return `${base}better_forecast?station_id=${this.config.stationid}&units_temp=c&units_wind=kph&units_pressure=mb&units_precip=mm&units_distance=km&token=${this.config.token}`;
	}

	/**
	 * Process the raw API data
	 * @param {object} data - Raw API response
	 * @returns {object} Processed weather data
	 */
	processData (data) {
		try {
			let weatherData;
			if (this.config.type === "current") {
				weatherData = this.generateCurrentWeather(data);
			} else if (this.config.type === "hourly") {
				weatherData = this.generateHourly(data);
			} else {
				weatherData = this.generateForecast(data);
			}

			return weatherData;
		} catch (error) {
			Log.error("[weatherflow] Data processing error:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: "Failed to process weather data",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
			return null;
		}
	}

	/**
	 * Generate current weather data
	 * @param {object} data - API response data
	 * @returns {object} Current weather object
	 */
	generateCurrentWeather (data) {
		if (!data || !data.current_conditions || !data.forecast || !Array.isArray(data.forecast.daily) || data.forecast.daily.length === 0) {
			Log.error("[weatherflow] Invalid current weather data structure");
			return null;
		}

		const current = data.current_conditions;
		const daily = data.forecast.daily[0];

		const weather = {
			date: new Date(),
			humidity: current.relative_humidity || null,
			temperature: current.air_temperature || null,
			feelsLikeTemp: current.feels_like || null,
			windSpeed: current.wind_avg != null ? convertKmhToMs(current.wind_avg) : null,
			windFromDirection: current.wind_direction || null,
			weatherType: this.convertWeatherType(current.icon),
			uvIndex: current.uv || null,
			sunrise: daily.sunrise ? new Date(daily.sunrise * 1000) : null,
			sunset: daily.sunset ? new Date(daily.sunset * 1000) : null
		};

		return weather;
	}

	/**
	 * Generate forecast data
	 * @param {object} data - API response data
	 * @returns {Array} Array of forecast objects
	 */
	generateForecast (data) {
		if (!data || !data.forecast || !Array.isArray(data.forecast.daily) || !Array.isArray(data.forecast.hourly)) {
			Log.error("[weatherflow] Invalid forecast data structure");
			return [];
		}

		const days = [];

		for (const forecast of data.forecast.daily) {
			const weather = {
				date: new Date(forecast.day_start_local * 1000),
				minTemperature: forecast.air_temp_low || null,
				maxTemperature: forecast.air_temp_high || null,
				precipitationProbability: forecast.precip_probability || null,
				weatherType: this.convertWeatherType(forecast.icon),
				precipitationAmount: 0.0,
				precipitationUnits: "mm",
				uvIndex: 0
			};

			// Build UV and precipitation from hourly data
			for (const hour of data.forecast.hourly) {
				const hourDate = new Date(hour.time * 1000);
				const forecastDate = new Date(forecast.day_start_local * 1000);

				// Compare year, month, and day to ensure correct matching across month boundaries
				if (hourDate.getFullYear() === forecastDate.getFullYear()
					&& hourDate.getMonth() === forecastDate.getMonth()
					&& hourDate.getDate() === forecastDate.getDate()) {
					weather.uvIndex = Math.max(weather.uvIndex, hour.uv || 0);
					weather.precipitationAmount += hour.precip || 0;
				} else if (hourDate > forecastDate) {
					// Check if we've moved to the next day
					const diffMs = hourDate - forecastDate;
					if (diffMs >= 86400000) break; // 24 hours in ms
				}
			}

			days.push(weather);
		}

		return days;
	}

	/**
	 * Generate hourly forecast data
	 * @param {object} data - API response data
	 * @returns {Array} Array of hourly forecast objects
	 */
	generateHourly (data) {
		if (!data || !data.forecast || !Array.isArray(data.forecast.hourly)) {
			Log.error("[weatherflow] Invalid hourly data structure");
			return [];
		}

		const hours = [];

		for (const hour of data.forecast.hourly) {
			const weather = {
				date: new Date(hour.time * 1000),
				temperature: hour.air_temperature || null,
				feelsLikeTemp: hour.feels_like || null,
				humidity: hour.relative_humidity || null,
				windSpeed: hour.wind_avg != null ? convertKmhToMs(hour.wind_avg) : null,
				windFromDirection: hour.wind_direction || null,
				weatherType: this.convertWeatherType(hour.icon),
				precipitationProbability: hour.precip_probability || null,
				precipitationAmount: hour.precip || 0,
				precipitationUnits: "mm",
				uvIndex: hour.uv || null
			};

			hours.push(weather);

			// WeatherFlow provides 10 days of hourly data, trim to 48 hours
			if (hours.length >= 48) break;
		}

		return hours;
	}

	/**
	 * Convert weather icon type
	 * @param {string} weatherType - WeatherFlow icon code
	 * @returns {string} Weather icon CSS class
	 */
	convertWeatherType (weatherType) {
		const weatherTypes = {
			"clear-day": "day-sunny",
			"clear-night": "night-clear",
			cloudy: "cloudy",
			foggy: "fog",
			"partly-cloudy-day": "day-cloudy",
			"partly-cloudy-night": "night-alt-cloudy",
			"possibly-rainy-day": "day-rain",
			"possibly-rainy-night": "night-alt-rain",
			"possibly-sleet-day": "day-sleet",
			"possibly-sleet-night": "night-alt-sleet",
			"possibly-snow-day": "day-snow",
			"possibly-snow-night": "night-alt-snow",
			"possibly-thunderstorm-day": "day-thunderstorm",
			"possibly-thunderstorm-night": "night-alt-thunderstorm",
			rainy: "rain",
			sleet: "sleet",
			snow: "snow",
			thunderstorm: "thunderstorm",
			windy: "strong-wind"
		};

		return weatherTypes[weatherType] || null;
	}

	/**
	 * Start fetching data
	 */
	start () {
		if (this.fetcher) {
			this.fetcher.startPeriodicFetch();
		}
	}

	/**
	 * Stop fetching data
	 */
	stop () {
		if (this.fetcher) {
			this.fetcher.clearTimer();
		}
	}
}

module.exports = WeatherFlowProvider;
