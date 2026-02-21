const Log = require("logger");
const HTTPFetcher = require("#http_fetcher");

/**
 * Weatherbit weather provider
 * See: https://www.weatherbit.io/
 */
class WeatherbitProvider {
	constructor (config) {
		this.config = {
			apiBase: "https://api.weatherbit.io/v2.0",
			apiKey: "",
			lat: 0,
			lon: 0,
			type: "current",
			updateInterval: 10 * 60 * 1000,
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
		if (!this.config.apiKey || this.config.apiKey === "YOUR_API_KEY_HERE") {
			Log.error("[weatherprovider.weatherbit] No API key configured");
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: "Weatherbit API key required. Get one at https://www.weatherbit.io/",
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
				Accept: "application/json"
			},
			logContext: "weatherprovider.weatherbit"
		});

		this.fetcher.on("response", async (response) => {
			try {
				const data = await response.json();
				this.handleResponse(data);
			} catch (error) {
				Log.error("[weatherprovider.weatherbit] Parse error:", error);
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

	getUrl () {
		const endpoint = this.getWeatherEndpoint();
		return `${this.config.apiBase}${endpoint}?lat=${this.config.lat}&lon=${this.config.lon}&units=M&key=${this.config.apiKey}`;
	}

	getWeatherEndpoint () {
		switch (this.config.type) {
			case "hourly":
				return "/forecast/hourly";
			case "daily":
			case "forecast":
				return "/forecast/daily";
			case "current":
			default:
				return "/current";
		}
	}

	handleResponse (data) {
		if (!data || !data.data || data.data.length === 0) {
			Log.error("[weatherprovider.weatherbit] No usable data received");
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
		}

		if (weatherData && this.onDataCallback) {
			this.onDataCallback(weatherData);
		}
	}

	generateCurrentWeather (data) {
		if (!data.data[0] || typeof data.data[0].temp === "undefined") {
			return null;
		}

		const current = data.data[0];

		// Calculate timezone offset to convert sunrise/sunset to local time
		const tzOffset = new Date().getTimezoneOffset() * -1; // invert

		const weather = {
			date: new Date(current.ts * 1000),
			temperature: parseFloat(current.temp),
			humidity: parseFloat(current.rh),
			windSpeed: parseFloat(current.wind_spd),
			windDirection: current.wind_dir || null,
			weatherType: this.convertWeatherType(current.weather.icon),
			sunrise: null,
			sunset: null
		};

		// Parse sunrise/sunset from HH:mm format
		if (current.sunrise) {
			const [hours, minutes] = current.sunrise.split(":");
			const sunrise = new Date();
			sunrise.setHours(parseInt(hours), parseInt(minutes) + tzOffset, 0, 0);
			weather.sunrise = sunrise;
		}

		if (current.sunset) {
			const [hours, minutes] = current.sunset.split(":");
			const sunset = new Date();
			sunset.setHours(parseInt(hours), parseInt(minutes) + tzOffset, 0, 0);
			weather.sunset = sunset;
		}

		return weather;
	}

	generateForecast (data) {
		const days = [];

		for (const forecast of data.data) {
			days.push({
				date: new Date(forecast.datetime),
				minTemperature: forecast.min_temp !== undefined ? parseFloat(forecast.min_temp) : null,
				maxTemperature: forecast.max_temp !== undefined ? parseFloat(forecast.max_temp) : null,
				precipitation: forecast.precip !== undefined ? parseFloat(forecast.precip) : 0,
				precipitationProbability: forecast.pop !== undefined ? parseFloat(forecast.pop) : null,
				weatherType: this.convertWeatherType(forecast.weather.icon)
			});
		}

		return days;
	}

	generateHourly (data) {
		const hours = [];

		for (const forecast of data.data) {
			hours.push({
				date: new Date(forecast.timestamp_local),
				temperature: forecast.temp !== undefined ? parseFloat(forecast.temp) : null,
				precipitation: forecast.precip !== undefined ? parseFloat(forecast.precip) : 0,
				precipitationProbability: forecast.pop !== undefined ? parseFloat(forecast.pop) : null,
				windSpeed: forecast.wind_spd !== undefined ? parseFloat(forecast.wind_spd) : null,
				windDirection: forecast.wind_dir || null,
				weatherType: this.convertWeatherType(forecast.weather.icon)
			});
		}

		return hours;
	}

	/**
	 * Convert Weatherbit icon codes to weathericons.css icons
	 * See: https://www.weatherbit.io/api/codes
	 * @param weatherType
	 */
	convertWeatherType (weatherType) {
		const weatherTypes = {
			t01d: "day-thunderstorm",
			t01n: "night-alt-thunderstorm",
			t02d: "day-thunderstorm",
			t02n: "night-alt-thunderstorm",
			t03d: "thunderstorm",
			t03n: "thunderstorm",
			t04d: "day-thunderstorm",
			t04n: "night-alt-thunderstorm",
			t05d: "day-sleet-storm",
			t05n: "night-alt-sleet-storm",
			d01d: "day-sprinkle",
			d01n: "night-alt-sprinkle",
			d02d: "day-sprinkle",
			d02n: "night-alt-sprinkle",
			d03d: "day-shower",
			d03n: "night-alt-shower",
			r01d: "day-shower",
			r01n: "night-alt-shower",
			r02d: "day-rain",
			r02n: "night-alt-rain",
			r03d: "day-rain",
			r03n: "night-alt-rain",
			r04d: "day-sprinkle",
			r04n: "night-alt-sprinkle",
			r05d: "day-shower",
			r05n: "night-alt-shower",
			r06d: "day-shower",
			r06n: "night-alt-shower",
			f01d: "day-sleet",
			f01n: "night-alt-sleet",
			s01d: "day-snow",
			s01n: "night-alt-snow",
			s02d: "day-snow-wind",
			s02n: "night-alt-snow-wind",
			s03d: "snowflake-cold",
			s03n: "snowflake-cold",
			s04d: "day-rain-mix",
			s04n: "night-alt-rain-mix",
			s05d: "day-sleet",
			s05n: "night-alt-sleet",
			s06d: "day-snow",
			s06n: "night-alt-snow",
			a01d: "day-haze",
			a01n: "dust",
			a02d: "smoke",
			a02n: "smoke",
			a03d: "day-haze",
			a03n: "dust",
			a04d: "dust",
			a04n: "dust",
			a05d: "day-fog",
			a05n: "night-fog",
			a06d: "fog",
			a06n: "fog",
			c01d: "day-sunny",
			c01n: "night-clear",
			c02d: "day-sunny-overcast",
			c02n: "night-alt-partly-cloudy",
			c03d: "day-cloudy",
			c03n: "night-alt-cloudy",
			c04d: "cloudy",
			c04n: "cloudy",
			u00d: "rain-mix",
			u00n: "rain-mix"
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

module.exports = WeatherbitProvider;
