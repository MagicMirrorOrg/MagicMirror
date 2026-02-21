const Log = require("logger");
const { limitDecimals, getSunTimes, isDayTime } = require("../provider-utils");
const HTTPFetcher = require("#http_fetcher");

/**
 * Server-side weather provider for SMHI (Swedish Meteorological and Hydrological Institute)
 * Sweden only, metric system
 * API: https://opendata.smhi.se/apidocs/metfcst/
 */
class SMHIProvider {
	constructor (config) {
		this.config = {
			lat: 0,
			lon: 0,
			precipitationValue: "pmedian", // pmin, pmean, pmedian, pmax
			type: "current",
			updateInterval: 5 * 60 * 1000,
			...config
		};

		// Validate precipitationValue
		if (!["pmin", "pmean", "pmedian", "pmax"].includes(this.config.precipitationValue)) {
			Log.warn(`[weatherprovider.smhi] Invalid precipitationValue: ${this.config.precipitationValue}, using pmedian`);
			this.config.precipitationValue = "pmedian";
		}

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
		if (this.config.lat == null || this.config.lon == null) {
			throw new Error("Latitude and longitude are required");
		}

		// SMHI requires max 6 decimal places
		this.config.lat = limitDecimals(this.config.lat, 6);
		this.config.lon = limitDecimals(this.config.lon, 6);
	}

	#initializeFetcher () {
		const url = this.#getURL();

		this.fetcher = new HTTPFetcher(url, {
			reloadInterval: this.config.updateInterval,
			logContext: "weatherprovider.smhi"
		});

		this.fetcher.on("response", async (response) => {
			try {
				const data = await response.json();
				this.#handleResponse(data);
			} catch (error) {
				Log.error("[weatherprovider.smhi] Failed to parse JSON:", error);
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
			if (!data.timeSeries || !Array.isArray(data.timeSeries)) {
				throw new Error("Invalid weather data");
			}

			const coordinates = this.#resolveCoordinates(data);
			let weatherData;

			switch (this.config.type) {
				case "current":
					weatherData = this.#generateCurrentWeather(data.timeSeries, coordinates);
					break;
				case "forecast":
				case "daily":
					weatherData = this.#generateForecast(data.timeSeries, coordinates);
					break;
				case "hourly":
					weatherData = this.#generateHourly(data.timeSeries, coordinates);
					break;
			}

			if (this.onDataCallback) {
				this.onDataCallback(weatherData);
			}
		} catch (error) {
			Log.error("[weatherprovider.smhi] Error processing weather data:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: error.message,
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
		}
	}

	#generateCurrentWeather (timeSeries, coordinates) {
		const closest = this.#getClosestToCurrentTime(timeSeries);
		return this.#convertWeatherDataToObject(closest, coordinates);
	}

	#generateForecast (timeSeries, coordinates) {
		const filled = this.#fillInGaps(timeSeries);
		return this.#convertWeatherDataGroupedBy(filled, coordinates, "day");
	}

	#generateHourly (timeSeries, coordinates) {
		const filled = this.#fillInGaps(timeSeries);
		return this.#convertWeatherDataGroupedBy(filled, coordinates, "hour");
	}

	#getClosestToCurrentTime (times) {
		const now = new Date();
		let minDiff = null;
		let closest = times[0];

		for (const time of times) {
			const validTime = new Date(time.validTime);
			const diff = Math.abs(validTime - now);

			if (minDiff === null || diff < minDiff) {
				minDiff = diff;
				closest = time;
			}
		}

		return closest;
	}

	#convertWeatherDataToObject (weatherData, coordinates) {
		const date = new Date(weatherData.validTime);
		const { sunrise, sunset } = getSunTimes(date, coordinates.lat, coordinates.lon);
		const isDay = isDayTime(date, sunrise, sunset);

		const current = {
			date: date,
			humidity: this.#paramValue(weatherData, "r"),
			temperature: this.#paramValue(weatherData, "t"),
			windSpeed: this.#paramValue(weatherData, "ws"),
			windFromDirection: this.#paramValue(weatherData, "wd"),
			weatherType: this.#convertWeatherType(this.#paramValue(weatherData, "Wsymb2"), isDay),
			feelsLikeTemp: this.#calculateApparentTemperature(weatherData),
			sunrise: sunrise,
			sunset: sunset,
			snow: 0,
			rain: 0,
			precipitationAmount: 0
		};

		// Determine precipitation amount and category
		const precipitationValue = this.#paramValue(weatherData, this.config.precipitationValue);
		const pcat = this.#paramValue(weatherData, "pcat");

		switch (pcat) {
			case 1: // Snow
				current.snow = precipitationValue;
				current.precipitationAmount = precipitationValue;
				break;
			case 2: // Snow and rain (50/50 split)
				current.snow = precipitationValue / 2;
				current.rain = precipitationValue / 2;
				current.precipitationAmount = precipitationValue;
				break;
			case 3: // Rain
			case 4: // Drizzle
			case 5: // Freezing rain
			case 6: // Freezing drizzle
				current.rain = precipitationValue;
				current.precipitationAmount = precipitationValue;
				break;
			// case 0: No precipitation - defaults already set to 0
		}

		return current;
	}

	#convertWeatherDataGroupedBy (allWeatherData, coordinates, groupBy = "day") {
		const result = [];
		let currentWeather = null;
		let dayWeatherTypes = [];

		const allWeatherObjects = allWeatherData.map((data) => this.#convertWeatherDataToObject(data, coordinates));

		for (const weatherObject of allWeatherObjects) {
			const objDate = new Date(weatherObject.date);

			// Check if we need a new group (day or hour change)
			const needNewGroup = !currentWeather || !this.#isSamePeriod(currentWeather.date, objDate, groupBy);

			if (needNewGroup) {
				currentWeather = {
					date: objDate,
					temperature: weatherObject.temperature,
					minTemperature: Infinity,
					maxTemperature: -Infinity,
					snow: 0,
					rain: 0,
					precipitationAmount: 0,
					sunrise: weatherObject.sunrise,
					sunset: weatherObject.sunset
				};
				dayWeatherTypes = [];
				result.push(currentWeather);
			}

			// Track weather types during daytime
			const { sunrise: daySunrise, sunset: daySunset } = getSunTimes(objDate, coordinates.lat, coordinates.lon);
			const isDay = isDayTime(objDate, daySunrise, daySunset);

			if (isDay) {
				dayWeatherTypes.push(weatherObject.weatherType);
			}

			// Use median weather type from daytime hours
			if (dayWeatherTypes.length > 0) {
				currentWeather.weatherType = dayWeatherTypes[Math.floor(dayWeatherTypes.length / 2)];
			} else {
				currentWeather.weatherType = weatherObject.weatherType;
			}

			// Aggregate min/max and precipitation
			currentWeather.minTemperature = Math.min(currentWeather.minTemperature, weatherObject.temperature);
			currentWeather.maxTemperature = Math.max(currentWeather.maxTemperature, weatherObject.temperature);
			currentWeather.snow += weatherObject.snow;
			currentWeather.rain += weatherObject.rain;
			currentWeather.precipitationAmount += weatherObject.precipitationAmount;
		}

		return result;
	}

	#isSamePeriod (date1, date2, groupBy) {
		if (groupBy === "hour") {
			return date1.getFullYear() === date2.getFullYear()
				&& date1.getMonth() === date2.getMonth()
				&& date1.getDate() === date2.getDate()
				&& date1.getHours() === date2.getHours();
		} else { // day
			return date1.getFullYear() === date2.getFullYear()
				&& date1.getMonth() === date2.getMonth()
				&& date1.getDate() === date2.getDate();
		}
	}

	#fillInGaps (data) {
		const result = [];

		for (let i = 1; i < data.length; i++) {
			const from = new Date(data[i - 1].validTime);
			const to = new Date(data[i].validTime);
			const hours = Math.floor((to - from) / (1000 * 60 * 60));

			// Add datapoint for each hour
			for (let j = 0; j < hours; j++) {
				const current = { ...data[i] };
				const newTime = new Date(from);
				newTime.setHours(from.getHours() + j);
				current.validTime = newTime.toISOString();
				result.push(current);
			}
		}

		return result;
	}

	#resolveCoordinates (data) {
		// SMHI returns coordinates in [lon, lat] format
		return {
			lat: data.geometry.coordinates[0][1],
			lon: data.geometry.coordinates[0][0]
		};
	}

	#calculateApparentTemperature (weatherData) {
		const Ta = this.#paramValue(weatherData, "t");
		const rh = this.#paramValue(weatherData, "r");
		const ws = this.#paramValue(weatherData, "ws");
		const p = (rh / 100) * 6.105 * Math.exp((17.27 * Ta) / (237.7 + Ta));

		return Ta + 0.33 * p - 0.7 * ws - 4;
	}

	#paramValue (weatherData, name) {
		const param = weatherData.parameters.find((p) => p.name === name);
		return param ? param.values[0] : null;
	}

	#convertWeatherType (input, isDayTime) {
		switch (input) {
			case 1:
				return isDayTime ? "day-sunny" : "night-clear"; // Clear sky
			case 2:
				return isDayTime ? "day-sunny-overcast" : "night-partly-cloudy"; // Nearly clear sky
			case 3:
			case 4:
				return isDayTime ? "day-cloudy" : "night-cloudy"; // Variable/halfclear cloudiness
			case 5:
			case 6:
				return "cloudy"; // Cloudy/overcast
			case 7:
				return "fog";
			case 8:
			case 9:
			case 10:
				return "showers"; // Light/moderate/heavy rain showers
			case 11:
			case 21:
				return "thunderstorm";
			case 12:
			case 13:
			case 14:
			case 22:
			case 23:
			case 24:
				return "sleet"; // Light/moderate/heavy sleet (showers)
			case 15:
			case 16:
			case 17:
			case 25:
			case 26:
			case 27:
				return "snow"; // Light/moderate/heavy snow (showers/fall)
			case 18:
			case 19:
			case 20:
				return "rain"; // Light/moderate/heavy rain
			default:
				return null;
		}
	}

	#getURL () {
		const lon = this.config.lon.toFixed(6);
		const lat = this.config.lat.toFixed(6);
		return `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon}/lat/${lat}/data.json`;
	}
}

module.exports = SMHIProvider;
