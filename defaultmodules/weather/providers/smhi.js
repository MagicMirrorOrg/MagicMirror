const Log = require("logger");
const { getSunTimes, isDayTime, validateCoordinates } = require("../provider-utils");
const HTTPFetcher = require("#http_fetcher");

/**
 * Server-side weather provider for SMHI (Swedish Meteorological and Hydrological Institute)
 * Sweden only, metric system
 *
 * API: SNOW1gv1 — https://opendata.smhi.se/metfcst/snow1gv1
 * Migrated from PMP3gv2 (deprecated 2026-03-31, returns HTTP 404)
 *
 * Version: 2.0.1 (2026-04-02)
 *
 * Key differences from PMP3gv2:
 * - URL: snow1g/version/1 (was pmp3g/version/2)
 * - Time key: "time" (was "validTime")
 * - Data structure: flat object entry.data.X (was parameters[].find().values[0])
 * - Parameter names: human-readable (air_temperature, wind_speed, etc.)
 * - Coordinates: flat [lon, lat] (was nested [[lon, lat]])
 * - Precipitation types: different value mapping (1=rain, not snow)
 */

/**
 * Maps user-facing config precipitationValue to SNOW1gv1 parameter names.
 * Maintains backward compatibility with existing MagicMirror configs.
 */
const PRECIP_VALUE_MAP = {
	pmin: "precipitation_amount_min",
	pmean: "precipitation_amount_mean",
	pmedian: "precipitation_amount_median",
	pmax: "precipitation_amount_max"
};

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
		if (!Object.keys(PRECIP_VALUE_MAP).includes(this.config.precipitationValue)) {
			Log.warn(`[smhi] Invalid precipitationValue: ${this.config.precipitationValue}, using pmedian`);
			this.config.precipitationValue = "pmedian";
		}

		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
	}

	initialize () {
		try {
			// SMHI requires max 6 decimal places
			validateCoordinates(this.config, 6);
			this.#initializeFetcher();
		} catch (error) {
			Log.error("[smhi] Initialization failed:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: error.message,
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
		}
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
			logContext: "weatherprovider.smhi"
		});

		this.fetcher.on("response", async (response) => {
			try {
				const data = await response.json();
				this.#handleResponse(data);
			} catch (error) {
				Log.error("[smhi] Failed to parse JSON:", error);
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
				default:
					Log.error(`[smhi] Unknown weather type: ${this.config.type}`);
					if (this.onErrorCallback) {
						this.onErrorCallback({
							message: `Unknown weather type: ${this.config.type}`,
							translationKey: "MODULE_ERROR_UNSPECIFIED"
						});
					}
					return;
			}

			if (this.onDataCallback) {
				this.onDataCallback(weatherData);
			}
		} catch (error) {
			Log.error("[smhi] Error processing weather data:", error);
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

	/**
	 * Find the time series entry closest to the current time.
	 * SNOW1gv1 uses "time" instead of PMP3gv2's "validTime".
	 * @param times
	 */
	#getClosestToCurrentTime (times) {
		const now = new Date();
		let minDiff = null;
		let closest = times[0];

		for (const time of times) {
			const entryTime = new Date(time.time);
			const diff = Math.abs(entryTime - now);

			if (minDiff === null || diff < minDiff) {
				minDiff = diff;
				closest = time;
			}
		}

		return closest;
	}

	/**
	 * Convert a single SNOW1gv1 time series entry to MagicMirror weather object.
	 *
	 * SNOW1gv1 data structure: entry.data.parameter_name (flat object)
	 * PMP3gv2 used: entry.parameters[{name, values}] (array of objects)
	 * @param weatherData
	 * @param coordinates
	 */
	#convertWeatherDataToObject (weatherData, coordinates) {
		const date = new Date(weatherData.time);
		const { sunrise, sunset } = getSunTimes(date, coordinates.lat, coordinates.lon);
		const isDay = isDayTime(date, sunrise, sunset);

		const current = {
			date: date,
			humidity: this.#paramValue(weatherData, "relative_humidity"),
			temperature: this.#paramValue(weatherData, "air_temperature"),
			windSpeed: this.#paramValue(weatherData, "wind_speed"),
			windFromDirection: this.#paramValue(weatherData, "wind_from_direction"),
			weatherType: this.#convertWeatherType(this.#paramValue(weatherData, "symbol_code"), isDay),
			feelsLikeTemp: this.#calculateApparentTemperature(weatherData),
			sunrise: sunrise,
			sunset: sunset,
			snow: 0,
			rain: 0,
			precipitationAmount: 0
		};

		// Map user config (pmedian/pmean/pmin/pmax) to SNOW1gv1 parameter name
		const precipParamName = PRECIP_VALUE_MAP[this.config.precipitationValue];
		const precipitationValue = this.#paramValue(weatherData, precipParamName);
		const pcat = this.#paramValue(weatherData, "predominant_precipitation_type_at_surface");

		// SNOW1gv1 precipitation type mapping (differs from PMP3gv2!):
		//   0  = no precipitation
		//   1  = rain
		//   2  = sleet (snow + rain mix)
		//   5  = snow / freezing rain
		//   6  = freezing mixed precipitation
		//   11 = drizzle / light rain
		switch (pcat) {
			case 1: // Rain
			case 11: // Drizzle / light rain
				current.rain = precipitationValue;
				current.precipitationAmount = precipitationValue;
				break;
			case 2: // Sleet / mixed rain and snow
				current.snow = precipitationValue / 2;
				current.rain = precipitationValue / 2;
				current.precipitationAmount = precipitationValue;
				break;
			case 5: // Snow / freezing rain
			case 6: // Freezing mixed precipitation
				current.snow = precipitationValue;
				current.precipitationAmount = precipitationValue;
				break;
			case 0:
			default:
				break;
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

	/**
	 * Fill gaps in time series data for forecast/hourly grouping.
	 * SNOW1gv1 has variable time steps: 1h (0-48h), 2h (49-72h), 6h (73-132h), 12h (133h+).
	 * Uses "time" key instead of PMP3gv2's "validTime".
	 * @param data
	 */
	#fillInGaps (data) {
		if (data.length === 0) return [];

		const result = [];
		result.push(data[0]);

		for (let i = 1; i < data.length; i++) {
			const from = new Date(data[i - 1].time);
			const to = new Date(data[i].time);
			const hours = Math.floor((to - from) / (1000 * 60 * 60));

			// Fill gaps with previous data point (start at j=1 since j=0 is already pushed)
			for (let j = 1; j < hours; j++) {
				const current = { ...data[i - 1] };
				const newTime = new Date(from);
				newTime.setHours(from.getHours() + j);
				current.time = newTime.toISOString();
				result.push(current);
			}

			// Push original data point
			result.push(data[i]);
		}

		return result;
	}

	/**
	 * Extract coordinates from SNOW1gv1 response.
	 * SNOW1gv1 returns flat GeoJSON Point: { coordinates: [lon, lat] }
	 * PMP3gv2 returned nested: { coordinates: [[lon, lat]] }
	 * @param data
	 */
	#resolveCoordinates (data) {
		const coords = data?.geometry?.coordinates;

		if (Array.isArray(coords) && coords.length >= 2 && typeof coords[0] === "number") {
			// SNOW1gv1 flat format: [lon, lat]
			return {
				lat: coords[1],
				lon: coords[0]
			};
		}

		Log.warn("[smhi] Invalid coordinate structure in response, using config values");
		return {
			lat: this.config.lat,
			lon: this.config.lon
		};
	}

	/**
	 * Calculate apparent (feels-like) temperature using humidity and wind.
	 * Uses SNOW1gv1 parameter names.
	 * @param weatherData
	 */
	#calculateApparentTemperature (weatherData) {
		const Ta = this.#paramValue(weatherData, "air_temperature");
		const rh = this.#paramValue(weatherData, "relative_humidity");
		const ws = this.#paramValue(weatherData, "wind_speed");

		if (Ta === null || rh === null || ws === null) {
			return Ta; // Fallback to raw temperature if data missing
		}

		const p = (rh / 100) * 6.105 * Math.exp((17.27 * Ta) / (237.7 + Ta));
		return Ta + 0.33 * p - 0.7 * ws - 4;
	}

	/**
	 * Get parameter value from SNOW1gv1 flat data structure.
	 * SNOW1gv1: weatherData.data.parameter_name (direct property access)
	 * PMP3gv2 used: weatherData.parameters.find(p => p.name === name).values[0]
	 *
	 * Returns null if parameter missing or equals SMHI missing value (9999).
	 * @param weatherData
	 * @param name
	 */
	#paramValue (weatherData, name) {
		const value = weatherData.data?.[name];

		if (value === undefined || value === null) {
			return null;
		}

		// SMHI uses 9999 as missing value sentinel for all parameters
		if (value === 9999) {
			return null;
		}

		return value;
	}

	/**
	 * Convert SMHI symbol_code (1-27) to MagicMirror weather icon names.
	 * Symbol codes are identical between PMP3gv2 and SNOW1gv1.
	 * @param input
	 * @param isDayTime
	 */
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

	/**
	 * Build SNOW1gv1 forecast URL.
	 * Changed from: pmp3g/version/2
	 * Changed to:   snow1g/version/1
	 */
	#getUrl () {
		const lon = this.config.lon.toFixed(6);
		const lat = this.config.lat.toFixed(6);
		return `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${lon}/lat/${lat}/data.json`;
	}
}

module.exports = SMHIProvider;
