const Log = require("logger");
const SunCalc = require("suncalc");
const HTTPFetcher = require("#http_fetcher");

/**
 * UK Met Office Data Hub provider
 * For more information: https://www.metoffice.gov.uk/services/data/datapoint/notifications/weather-datahub
 *
 * Data available:
 * - Hourly data for next 2 days (for current weather)
 * - 3-hourly data for next 7 days (for hourly forecasts)
 * - Daily data for next 7 days (for daily forecasts)
 *
 * Free accounts limited to 360 requests/day per service (once every 4 minutes)
 */
class UkMetOfficeDataHubProvider {
	constructor (config) {
		this.config = {
			apiBase: "https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/",
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
			Log.error("[weatherprovider.ukmetofficedatahub] No API key configured");
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: "UK Met Office DataHub API key required. Get one at https://datahub.metoffice.gov.uk/",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
			return;
		}

		this.initializeFetcher();
	}

	initializeFetcher () {
		const forecastType = this.getForecastType();
		const url = this.getUrl(forecastType);

		this.fetcher = new HTTPFetcher(url, {
			reloadInterval: this.config.updateInterval,
			headers: {
				Accept: "application/json",
				apikey: this.config.apiKey
			},
			logContext: "weatherprovider.ukmetofficedatahub"
		});

		this.fetcher.on("response", async (response) => {
			try {
				const data = await response.json();
				this.handleResponse(data);
			} catch (error) {
				Log.error("[weatherprovider.ukmetofficedatahub] Parse error:", error);
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

	getForecastType () {
		switch (this.config.type) {
			case "hourly":
				return "three-hourly";
			case "forecast":
			case "daily":
				return "daily";
			case "current":
			default:
				return "hourly";
		}
	}

	getUrl (forecastType) {
		const base = this.config.apiBase.endsWith("/") ? this.config.apiBase : `${this.config.apiBase}/`;
		const queryStrings = `?latitude=${this.config.lat}&longitude=${this.config.lon}&includeLocationName=true`;
		return `${base}${forecastType}${queryStrings}`;
	}

	handleResponse (data) {
		if (!data || !data.features || !data.features[0] || !data.features[0].properties || !data.features[0].properties.timeSeries || data.features[0].properties.timeSeries.length === 0) {
			Log.error("[weatherprovider.ukmetofficedatahub] No usable data received");
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
		const timeSeries = data.features[0].properties.timeSeries;
		const now = new Date();

		// Find the hour that contains current time
		for (const hour of timeSeries) {
			const forecastTime = new Date(hour.time);
			const oneHourLater = new Date(forecastTime.getTime() + 60 * 60 * 1000);

			if (now >= forecastTime && now < oneHourLater) {
				const current = {
					date: forecastTime,
					temperature: hour.screenTemperature || null,
					minTemperature: hour.minScreenAirTemp || null,
					maxTemperature: hour.maxScreenAirTemp || null,
					windSpeed: hour.windSpeed10m || null,
					windDirection: hour.windDirectionFrom10m || null,
					weatherType: this.convertWeatherType(hour.significantWeatherCode),
					humidity: hour.screenRelativeHumidity || null,
					rain: hour.totalPrecipAmount || 0,
					snow: hour.totalSnowAmount || 0,
					precipitation: (hour.totalPrecipAmount || 0) + (hour.totalSnowAmount || 0),
					precipitationProbability: hour.probOfPrecipitation || null,
					feelsLikeTemp: hour.feelsLikeTemperature || null,
					sunrise: null,
					sunset: null
				};

				// Calculate sunrise/sunset using SunCalc
				const sunTimes = SunCalc.getTimes(now, this.config.lat, this.config.lon);
				current.sunrise = sunTimes.sunrise;
				current.sunset = sunTimes.sunset;

				return current;
			}
		}

		// Fallback to first hour if no match found
		const firstHour = timeSeries[0];
		const current = {
			date: new Date(firstHour.time),
			temperature: firstHour.screenTemperature || null,
			windSpeed: firstHour.windSpeed10m || null,
			windDirection: firstHour.windDirectionFrom10m || null,
			weatherType: this.convertWeatherType(firstHour.significantWeatherCode),
			humidity: firstHour.screenRelativeHumidity || null,
			feelsLikeTemp: firstHour.feelsLikeTemperature || null,
			sunrise: null,
			sunset: null
		};

		const sunTimes = SunCalc.getTimes(now, this.config.lat, this.config.lon);
		current.sunrise = sunTimes.sunrise;
		current.sunset = sunTimes.sunset;

		return current;
	}

	generateForecast (data) {
		const timeSeries = data.features[0].properties.timeSeries;
		const days = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (const day of timeSeries) {
			const forecastDate = new Date(day.time);
			forecastDate.setHours(0, 0, 0, 0);

			// Only include today and future days
			if (forecastDate >= today) {
				days.push({
					date: new Date(day.time),
					minTemperature: day.nightMinScreenTemperature || null,
					maxTemperature: day.dayMaxScreenTemperature || null,
					temperature: day.dayMaxScreenTemperature || null,
					windSpeed: day.midday10MWindSpeed || null,
					windDirection: day.midday10MWindDirection || null,
					weatherType: this.convertWeatherType(day.daySignificantWeatherCode),
					humidity: day.middayRelativeHumidity || null,
					rain: day.dayProbabilityOfRain || 0,
					snow: day.dayProbabilityOfSnow || 0,
					precipitation: 0,
					precipitationProbability: day.dayProbabilityOfPrecipitation || null,
					feelsLikeTemp: day.dayMaxFeelsLikeTemp || null
				});
			}
		}

		return days;
	}

	generateHourly (data) {
		const timeSeries = data.features[0].properties.timeSeries;
		const hours = [];

		for (const hour of timeSeries) {
			// 3-hourly data uses maxScreenAirTemp/minScreenAirTemp, not screenTemperature
			const temp = hour.screenTemperature !== undefined
				? hour.screenTemperature
				: (hour.maxScreenAirTemp !== undefined && hour.minScreenAirTemp !== undefined)
					? (hour.maxScreenAirTemp + hour.minScreenAirTemp) / 2
					: null;

			hours.push({
				date: new Date(hour.time),
				temperature: temp,
				windSpeed: hour.windSpeed10m || null,
				windDirection: hour.windDirectionFrom10m || null,
				weatherType: this.convertWeatherType(hour.significantWeatherCode),
				humidity: hour.screenRelativeHumidity || null,
				rain: hour.totalPrecipAmount || 0,
				snow: hour.totalSnowAmount || 0,
				precipitation: (hour.totalPrecipAmount || 0) + (hour.totalSnowAmount || 0),
				precipitationProbability: hour.probOfPrecipitation || null,
				feelsLikeTemp: hour.feelsLikeTemp || null
			});
		}

		return hours;
	}

	/**
	 * Convert Met Office significant weather code to weathericons.css icon
	 * See: https://metoffice.apiconnect.ibmcloud.com/metoffice/production/node/264
	 * @param {number} weatherType - Met Office weather code
	 * @returns {string|null} Weathericons.css icon name or null
	 */
	convertWeatherType (weatherType) {
		const weatherTypes = {
			0: "night-clear",
			1: "day-sunny",
			2: "night-alt-cloudy",
			3: "day-cloudy",
			5: "fog",
			6: "fog",
			7: "cloudy",
			8: "cloud",
			9: "night-sprinkle",
			10: "day-sprinkle",
			11: "raindrops",
			12: "sprinkle",
			13: "night-alt-showers",
			14: "day-showers",
			15: "rain",
			16: "night-alt-sleet",
			17: "day-sleet",
			18: "sleet",
			19: "night-alt-hail",
			20: "day-hail",
			21: "hail",
			22: "night-alt-snow",
			23: "day-snow",
			24: "snow",
			25: "night-alt-snow",
			26: "day-snow",
			27: "snow",
			28: "night-alt-thunderstorm",
			29: "day-thunderstorm",
			30: "thunderstorm"
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

module.exports = UkMetOfficeDataHubProvider;
