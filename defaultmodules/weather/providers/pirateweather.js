const Log = require("logger");
const HTTPFetcher = require("#http_fetcher");

class PirateweatherProvider {
	constructor (config) {
		this.config = {
			apiBase: "https://api.pirateweather.net",
			weatherEndpoint: "/forecast",
			apiKey: "",
			lat: 0,
			lon: 0,
			type: "current",
			updateInterval: 10 * 60 * 1000,
			units: "us",
			...config
		};
		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
	}

	setCallbacks (onDataCallback, onErrorCallback) {
		this.onDataCallback = onDataCallback;
		this.onErrorCallback = onErrorCallback;
	}

	async initialize () {
		if (!this.config.apiKey) {
			Log.error("[pirateweather] No API key configured");
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: "API key required",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
			return;
		}

		this.initializeFetcher();
	}

	initializeFetcher () {
		const url = this.getUrl();

		this.fetcher = new HTTPFetcher(url, {
			reloadInterval: this.config.updateInterval,
			headers: {
				"Cache-Control": "no-cache",
				Accept: "application/json"
			},
			logContext: "weatherprovider.pirateweather"
		});

		this.fetcher.on("response", async (response) => {
			try {
				const data = await response.json();
				this.handleResponse(data);
			} catch (error) {
				Log.error("[pirateweather] Parse error:", error);
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

	handleResponse (data) {
		if (!data || (!data.currently && !data.daily && !data.hourly)) {
			Log.error("[pirateweather] No usable data received");
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: "No usable data in API response",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
			return;
		}

		let weatherData = null;

		switch (this.config.type) {
			case "current":
				weatherData = this.generateCurrentWeather(data);
				break;
			case "forecast":
			case "daily":
				weatherData = this.generateForecast(data);
				break;
			case "hourly":
				weatherData = this.generateHourly(data);
				break;
			default:
				Log.error(`[pirateweather] Unknown weather type: ${this.config.type}`);
				break;

		}

		if (weatherData && this.onDataCallback) {
			this.onDataCallback(weatherData);
		}
	}

	generateCurrentWeather (data) {
		if (!data.currently || typeof data.currently.temperature === "undefined") {
			return null;
		}

		const current = {
			date: new Date(),
			humidity: data.currently.humidity ? parseFloat(data.currently.humidity) * 100 : null,
			temperature: parseFloat(data.currently.temperature),
			feelsLikeTemp: data.currently.apparentTemperature ? parseFloat(data.currently.apparentTemperature) : null,
			windSpeed: data.currently.windSpeed ? parseFloat(data.currently.windSpeed) : null,
			windDirection: data.currently.windBearing || null,
			weatherType: this.convertWeatherType(data.currently.icon),
			sunrise: null,
			sunset: null
		};

		// Add sunrise/sunset from daily data if available
		if (data.daily && data.daily.data && data.daily.data.length > 0) {
			const today = data.daily.data[0];
			if (today.sunriseTime) {
				current.sunrise = new Date(today.sunriseTime * 1000);
			}
			if (today.sunsetTime) {
				current.sunset = new Date(today.sunsetTime * 1000);
			}
		}

		return current;
	}

	generateForecast (data) {
		if (!data.daily || !data.daily.data || !data.daily.data.length) {
			return [];
		}

		const days = [];

		for (const forecast of data.daily.data) {
			const day = {
				date: new Date(forecast.time * 1000),
				minTemperature: forecast.temperatureMin !== undefined ? parseFloat(forecast.temperatureMin) : null,
				maxTemperature: forecast.temperatureMax !== undefined ? parseFloat(forecast.temperatureMax) : null,
				weatherType: this.convertWeatherType(forecast.icon),
				snow: 0,
				rain: 0,
				precipitation: 0,
				precipitationProbability: forecast.precipProbability ? parseFloat(forecast.precipProbability) * 100 : null
			};

			// Handle precipitation
			let precip = 0;
			if (forecast.precipAccumulation !== undefined) {
				precip = forecast.precipAccumulation * 10; // cm to mm
			}

			day.precipitation = precip;

			if (forecast.precipType) {
				if (forecast.precipType === "snow") {
					day.snow = precip;
				} else {
					day.rain = precip;
				}
			}

			days.push(day);
		}

		return days;
	}

	generateHourly (data) {
		if (!data.hourly || !data.hourly.data || !data.hourly.data.length) {
			return [];
		}

		const hours = [];

		for (const forecast of data.hourly.data) {
			const hour = {
				date: new Date(forecast.time * 1000),
				temperature: forecast.temperature !== undefined ? parseFloat(forecast.temperature) : null,
				feelsLikeTemp: forecast.apparentTemperature !== undefined ? parseFloat(forecast.apparentTemperature) : null,
				weatherType: this.convertWeatherType(forecast.icon),
				windSpeed: forecast.windSpeed !== undefined ? parseFloat(forecast.windSpeed) : null,
				windDirection: forecast.windBearing || null,
				precipitationProbability: forecast.precipProbability ? parseFloat(forecast.precipProbability) * 100 : null,
				snow: 0,
				rain: 0,
				precipitation: 0
			};

			// Handle precipitation
			let precip = 0;
			if (forecast.precipAccumulation !== undefined) {
				precip = forecast.precipAccumulation * 10; // cm to mm
			}

			hour.precipitation = precip;

			if (forecast.precipType) {
				if (forecast.precipType === "snow") {
					hour.snow = precip;
				} else {
					hour.rain = precip;
				}
			}

			hours.push(hour);
		}

		return hours;
	}

	getUrl () {
		const apiBase = this.config.apiBase || "https://api.pirateweather.net";
		const weatherEndpoint = this.config.weatherEndpoint || "/forecast";
		return `${apiBase}${weatherEndpoint}/${this.config.apiKey}/${this.config.lat},${this.config.lon}?units=si&lang=${this.config.lang}`;
	}

	convertWeatherType (weatherType) {
		const weatherTypes = {
			"clear-day": "day-sunny",
			"clear-night": "night-clear",
			rain: "rain",
			snow: "snow",
			sleet: "snow",
			wind: "windy",
			fog: "fog",
			cloudy: "cloudy",
			"partly-cloudy-day": "day-cloudy",
			"partly-cloudy-night": "night-cloudy"
		};

		return weatherTypes[weatherType] || null;
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
}

module.exports = PirateweatherProvider;
