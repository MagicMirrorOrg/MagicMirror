const Log = require("logger");
const weatherUtils = require("../provider-utils");
const HTTPFetcher = require("#http_fetcher");

/**
 * Server-side weather provider for OpenWeatherMap
 * see https://openweathermap.org/
 */
class OpenWeatherMapProvider {
	constructor (config) {
		this.config = {
			apiVersion: "3.0",
			apiBase: "https://api.openweathermap.org/data/",
			weatherEndpoint: "/onecall",
			locationID: false,
			location: false,
			lat: 0,
			lon: 0,
			apiKey: "",
			type: "current",
			updateInterval: 10 * 60 * 1000,
			...config
		};

		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
		this.locationName = null;
	}

	initialize () {
		// Validate callbacks exist
		if (typeof this.onErrorCallback !== "function") {
			throw new Error("setCallbacks() must be called before initialize()");
		}

		if (!this.config.apiKey) {
			Log.error("[openweathermap] API key is required");
			this.onErrorCallback({
				message: "API key is required",
				translationKey: "MODULE_ERROR_UNSPECIFIED"
			});
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
		const url = this.#getUrl();

		this.fetcher = new HTTPFetcher(url, {
			reloadInterval: this.config.updateInterval,
			headers: { "Cache-Control": "no-cache" },
			logContext: "weatherprovider.openweathermap"
		});

		this.fetcher.on("response", async (response) => {
			try {
				const data = await response.json();
				this.#handleResponse(data);
			} catch (error) {
				Log.error("[openweathermap] Failed to parse JSON:", error);
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
		try {
			// Set location name from timezone
			if (data.timezone) {
				this.locationName = data.timezone;
			}

			let weatherData;
			const onecallData = this.#generateWeatherObjectsFromOnecall(data);

			switch (this.config.type) {
				case "current":
					weatherData = onecallData.current;
					break;
				case "forecast":
				case "daily":
					weatherData = onecallData.days;
					break;
				case "hourly":
					weatherData = onecallData.hours;
					break;
				default:
					Log.error(`[openweathermap] Unknown type: ${this.config.type}`);
					throw new Error(`Unknown weather type: ${this.config.type}`);
			}

			if (weatherData && this.onDataCallback) {
				this.onDataCallback(weatherData);
			}
		} catch (error) {
			Log.error("[openweathermap] Error processing weather data:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: error.message,
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
		}
	}

	#generateWeatherObjectsFromOnecall (data) {
		let precip;

		// Get current weather
		const current = {};
		if (data.hasOwnProperty("current")) {
			const timezoneOffset = data.timezone_offset / 60;
			current.date = weatherUtils.applyTimezoneOffset(new Date(data.current.dt * 1000), timezoneOffset);
			current.windSpeed = data.current.wind_speed;
			current.windFromDirection = data.current.wind_deg;
			current.sunrise = weatherUtils.applyTimezoneOffset(new Date(data.current.sunrise * 1000), timezoneOffset);
			current.sunset = weatherUtils.applyTimezoneOffset(new Date(data.current.sunset * 1000), timezoneOffset);
			current.temperature = data.current.temp;
			current.weatherType = weatherUtils.convertWeatherType(data.current.weather[0].icon);
			current.humidity = data.current.humidity;
			current.uvIndex = data.current.uvi;

			precip = false;
			if (data.current.hasOwnProperty("rain") && !isNaN(data.current.rain["1h"])) {
				current.rain = data.current.rain["1h"];
				precip = true;
			}
			if (data.current.hasOwnProperty("snow") && !isNaN(data.current.snow["1h"])) {
				current.snow = data.current.snow["1h"];
				precip = true;
			}
			if (precip) {
				current.precipitationAmount = (current.rain ?? 0) + (current.snow ?? 0);
			}
			current.feelsLikeTemp = data.current.feels_like;
		}

		// Get hourly weather
		const hours = [];
		if (data.hasOwnProperty("hourly")) {
			const timezoneOffset = data.timezone_offset / 60;
			for (const hour of data.hourly) {
				const weather = {};
				weather.date = weatherUtils.applyTimezoneOffset(new Date(hour.dt * 1000), timezoneOffset);
				weather.temperature = hour.temp;
				weather.feelsLikeTemp = hour.feels_like;
				weather.humidity = hour.humidity;
				weather.windSpeed = hour.wind_speed;
				weather.windFromDirection = hour.wind_deg;
				weather.weatherType = weatherUtils.convertWeatherType(hour.weather[0].icon);
				weather.precipitationProbability = hour.pop !== undefined ? hour.pop * 100 : undefined;
				weather.uvIndex = hour.uvi;

				precip = false;
				if (hour.hasOwnProperty("rain") && !isNaN(hour.rain["1h"])) {
					weather.rain = hour.rain["1h"];
					precip = true;
				}
				if (hour.hasOwnProperty("snow") && !isNaN(hour.snow["1h"])) {
					weather.snow = hour.snow["1h"];
					precip = true;
				}
				if (precip) {
					weather.precipitationAmount = (weather.rain ?? 0) + (weather.snow ?? 0);
				}

				hours.push(weather);
			}
		}

		// Get daily weather
		const days = [];
		if (data.hasOwnProperty("daily")) {
			const timezoneOffset = data.timezone_offset / 60;
			for (const day of data.daily) {
				const weather = {};
				weather.date = weatherUtils.applyTimezoneOffset(new Date(day.dt * 1000), timezoneOffset);
				weather.sunrise = weatherUtils.applyTimezoneOffset(new Date(day.sunrise * 1000), timezoneOffset);
				weather.sunset = weatherUtils.applyTimezoneOffset(new Date(day.sunset * 1000), timezoneOffset);
				weather.minTemperature = day.temp.min;
				weather.maxTemperature = day.temp.max;
				weather.humidity = day.humidity;
				weather.windSpeed = day.wind_speed;
				weather.windFromDirection = day.wind_deg;
				weather.weatherType = weatherUtils.convertWeatherType(day.weather[0].icon);
				weather.precipitationProbability = day.pop !== undefined ? day.pop * 100 : undefined;
				weather.uvIndex = day.uvi;

				precip = false;
				if (!isNaN(day.rain)) {
					weather.rain = day.rain;
					precip = true;
				}
				if (!isNaN(day.snow)) {
					weather.snow = day.snow;
					precip = true;
				}
				if (precip) {
					weather.precipitationAmount = (weather.rain ?? 0) + (weather.snow ?? 0);
				}

				days.push(weather);
			}
		}

		return { current, hours, days };
	}

	#getUrl () {
		return this.config.apiBase + this.config.apiVersion + this.config.weatherEndpoint + this.#getParams();
	}

	#getParams () {
		let params = "?";

		if (this.config.weatherEndpoint === "/onecall") {
			params += `lat=${this.config.lat}`;
			params += `&lon=${this.config.lon}`;

			if (this.config.type === "current") {
				params += "&exclude=minutely,hourly,daily";
			} else if (this.config.type === "hourly") {
				params += "&exclude=current,minutely,daily";
			} else if (this.config.type === "daily" || this.config.type === "forecast") {
				params += "&exclude=current,minutely,hourly";
			} else {
				params += "&exclude=minutely";
			}
		} else if (this.config.lat && this.config.lon) {
			params += `lat=${this.config.lat}&lon=${this.config.lon}`;
		} else if (this.config.locationID) {
			params += `id=${this.config.locationID}`;
		} else if (this.config.location) {
			params += `q=${this.config.location}`;
		}

		params += "&units=metric";
		params += `&lang=${this.config.lang || "en"}`;
		params += `&APPID=${this.config.apiKey}`;

		return params;
	}
}

module.exports = OpenWeatherMapProvider;
