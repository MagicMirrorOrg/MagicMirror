const Log = require("logger");
const HTTPFetcher = require("#http_fetcher");

/**
 * Server-side weather provider for Environment Canada MSC Datamart
 * Canada only, no API key required (anonymous access)
 *
 * Documentation:
 * https://dd.weather.gc.ca/citypage_weather/schema/
 * https://eccc-msc.github.io/open-data/msc-datamart/readme_en/
 *
 * Requires siteCode and provCode config parameters
 * See https://dd.weather.gc.ca/citypage_weather/docs/site_list_en.csv
 */
class EnvCanadaProvider {
	constructor (config) {
		this.config = {
			siteCode: "s0000000",
			provCode: "ON",
			type: "current",
			updateInterval: 10 * 60 * 1000,
			...config
		};

		this.fetcher = null;
		this.onDataCallback = null;
		this.onErrorCallback = null;
		this.lastCityPageURL = null;
		this.cacheCurrentTemp = 999;
		this.currentHour = null; // Track current hour for URL updates
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
		if (!this.config.siteCode || !this.config.provCode) {
			throw new Error("siteCode and provCode are required");
		}
	}

	#initializeFetcher () {
		this.currentHour = new Date().toISOString().substring(11, 13);
		const indexURL = this.#getIndexUrl();

		this.fetcher = new HTTPFetcher(indexURL, {
			reloadInterval: this.config.updateInterval,
			logContext: "weatherprovider.envcanada"
		});

		this.fetcher.on("response", async (response) => {
			try {
				// Check if hour changed - restart fetcher with new URL
				const newHour = new Date().toISOString().substring(11, 13);
				if (newHour !== this.currentHour) {
					Log.info("[weatherprovider.envcanada] Hour changed, reinitializing fetcher");
					this.stop();
					this.#initializeFetcher();
					this.start();
					return;
				}

				const html = await response.text();
				const cityPageURL = this.#extractCityPageURL(html);

				if (!cityPageURL) {
					Log.warn("[weatherprovider.envcanada] Could not find city page URL");
					return;
				}

				if (cityPageURL === this.lastCityPageURL) {
					Log.debug("[weatherprovider.envcanada] City page unchanged");
					return;
				}

				this.lastCityPageURL = cityPageURL;
				await this.#fetchCityPage(cityPageURL);

			} catch (error) {
				Log.error("[weatherprovider.envcanada] Error:", error);
				if (this.onErrorCallback) {
					this.onErrorCallback({
						message: error.message,
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

	async #fetchCityPage (url) {
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			const xml = await response.text();
			const weatherData = this.#parseWeatherData(xml);

			if (this.onDataCallback) {
				this.onDataCallback(weatherData);
			}
		} catch (error) {
			Log.error("[weatherprovider.envcanada] Fetch city page error:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback({
					message: "Failed to fetch city data",
					translationKey: "MODULE_ERROR_UNSPECIFIED"
				});
			}
		}
	}

	#parseWeatherData (xml) {
		switch (this.config.type) {
			case "current":
				return this.#generateCurrentWeather(xml);
			case "forecast":
			case "daily":
				return this.#generateForecast(xml);
			case "hourly":
				return this.#generateHourly(xml);
			default:
				return null;
		}
	}

	#generateCurrentWeather (xml) {
		const current = { date: new Date() };

		// Temperature (with caching for missing values)
		const temp = this.#extract(xml, /<currentConditions>.*?<temperature[^>]*>(.*?)<\/temperature>/s);
		if (temp && temp !== "") {
			current.temperature = parseFloat(temp);
			this.cacheCurrentTemp = current.temperature;
		} else {
			current.temperature = this.cacheCurrentTemp;
		}

		// Wind
		const windSpeed = this.#extract(xml, /<wind>.*?<speed[^>]*>(.*?)<\/speed>/s);
		current.windSpeed = (windSpeed === "calm") ? 0 : parseFloat(windSpeed) / 3.6;

		const windBearing = this.#extract(xml, /<wind>.*?<bearing[^>]*>(.*?)<\/bearing>/s);
		if (windBearing) current.windFromDirection = parseFloat(windBearing);

		// Humidity
		const humidity = this.#extract(xml, /<relativeHumidity[^>]*>(.*?)<\/relativeHumidity>/);
		if (humidity) current.humidity = parseFloat(humidity);

		// Feels like
		current.feelsLikeTemp = current.temperature;
		const windChill = this.#extract(xml, /<windChill[^>]*>(.*?)<\/windChill>/);
		const humidex = this.#extract(xml, /<humidex[^>]*>(.*?)<\/humidex>/);
		if (windChill) {
			current.feelsLikeTemp = parseFloat(windChill);
		} else if (humidex) {
			current.feelsLikeTemp = parseFloat(humidex);
		}

		// Weather type
		const iconCode = this.#extract(xml, /<currentConditions>.*?<iconCode[^>]*>(.*?)<\/iconCode>/s);
		if (iconCode) current.weatherType = this.#convertWeatherType(iconCode);

		// Sunrise/sunset
		const sunriseTime = this.#extract(xml, /<dateTime[^>]*name="sunrise"[^>]*>.*?<timeStamp>(.*?)<\/timeStamp>/s);
		const sunsetTime = this.#extract(xml, /<dateTime[^>]*name="sunset"[^>]*>.*?<timeStamp>(.*?)<\/timeStamp>/s);
		if (sunriseTime) current.sunrise = this.#parseECTime(sunriseTime);
		if (sunsetTime) current.sunset = this.#parseECTime(sunsetTime);

		return current;
	}

	#generateForecast (xml) {
		const days = [];
		const forecasts = xml.match(/<forecast>(.*?)<\/forecast>/gs) || [];

		if (forecasts.length === 0) return days;

		// Get current temp
		const currentTempStr = this.#extract(xml, /<currentConditions>.*?<temperature[^>]*>(.*?)<\/temperature>/s);
		const currentTemp = currentTempStr ? parseFloat(currentTempStr) : null;

		// Check if first forecast is Today or Tonight
		const isToday = forecasts[0].includes("textForecastName=\"Today\"");

		let nextDay = isToday ? 2 : 1;
		const lastDay = isToday ? 12 : 11;

		// Process first day
		const firstDay = {
			date: new Date(),
			precipitationProbability: null
		};
		this.#extractForecastTemps(firstDay, forecasts, 0, isToday, currentTemp);
		this.#extractForecastPrecip(firstDay, forecasts, 0);
		const firstIcon = this.#extract(forecasts[0], /<iconCode[^>]*>(.*?)<\/iconCode>/);
		if (firstIcon) firstDay.weatherType = this.#convertWeatherType(firstIcon);
		days.push(firstDay);

		// Process remaining days
		let date = new Date();
		for (let i = nextDay; i < lastDay && i < forecasts.length; i += 2) {
			date = new Date(date);
			date.setDate(date.getDate() + 1);

			const day = {
				date: new Date(date),
				precipitationProbability: null
			};
			this.#extractForecastTemps(day, forecasts, i, true, currentTemp);
			this.#extractForecastPrecip(day, forecasts, i);
			const icon = this.#extract(forecasts[i], /<iconCode[^>]*>(.*?)<\/iconCode>/);
			if (icon) day.weatherType = this.#convertWeatherType(icon);
			days.push(day);
		}

		return days;
	}

	#extractForecastTemps (weather, forecasts, index, hasToday, currentTemp) {
		let tempToday = null;
		let tempTonight = null;

		if (hasToday && forecasts[index]) {
			const temp = this.#extract(forecasts[index], /<temperature[^>]*>(.*?)<\/temperature>/);
			if (temp) tempToday = parseFloat(temp);
		}

		if (forecasts[index + 1]) {
			const temp = this.#extract(forecasts[index + 1], /<temperature[^>]*>(.*?)<\/temperature>/);
			if (temp) tempTonight = parseFloat(temp);
		}

		if (tempToday !== null && tempTonight !== null) {
			weather.maxTemperature = Math.max(tempToday, tempTonight);
			weather.minTemperature = Math.min(tempToday, tempTonight);
		} else if (tempToday !== null) {
			weather.maxTemperature = tempToday;
			weather.minTemperature = currentTemp || tempToday;
		} else if (tempTonight !== null) {
			weather.maxTemperature = currentTemp || tempTonight;
			weather.minTemperature = tempTonight;
		}
	}

	#extractForecastPrecip (weather, forecasts, index) {
		const precips = [];

		if (forecasts[index]) {
			const pop = this.#extract(forecasts[index], /<pop[^>]*>(.*?)<\/pop>/);
			if (pop) precips.push(parseFloat(pop));
		}

		if (forecasts[index + 1]) {
			const pop = this.#extract(forecasts[index + 1], /<pop[^>]*>(.*?)<\/pop>/);
			if (pop) precips.push(parseFloat(pop));
		}

		if (precips.length > 0) {
			weather.precipitationProbability = Math.max(...precips);
		}
	}

	#generateHourly (xml) {
		const hours = [];
		const hourlyMatches = xml.matchAll(/<hourlyForecast[^>]*dateTimeUTC="([^"]*)"[^>]*>(.*?)<\/hourlyForecast>/gs);

		const offsetStr = this.#extract(xml, /<hourlyForecastGroup>.*?UTCOffset="([^"]*)"/s);
		const utcOffset = offsetStr ? parseInt(offsetStr, 10) : 0;

		for (const [, dateTimeUTC, hourXML] of hourlyMatches) {
			const weather = {};

			const utcTime = this.#parseECTime(dateTimeUTC);
			weather.date = new Date(utcTime.getTime() + utcOffset * 60 * 60 * 1000);

			const temp = this.#extract(hourXML, /<temperature[^>]*>(.*?)<\/temperature>/);
			if (temp) weather.temperature = parseFloat(temp);

			const lop = this.#extract(hourXML, /<lop[^>]*>(.*?)<\/lop>/);
			if (lop) weather.precipitationProbability = parseFloat(lop);

			const icon = this.#extract(hourXML, /<iconCode[^>]*>(.*?)<\/iconCode>/);
			if (icon) weather.weatherType = this.#convertWeatherType(icon);

			hours.push(weather);
			if (hours.length >= 24) break;
		}

		return hours;
	}

	#extract (text, pattern) {
		const match = text.match(pattern);
		return match ? match[1].trim() : null;
	}

	#getIndexUrl () {
		const hour = new Date().toISOString().substring(11, 13);
		return `https://dd.weather.gc.ca/today/citypage_weather/${this.config.provCode}/${hour}/`;
	}

	#extractCityPageURL (html) {
		// New format: {timestamp}_MSC_CitypageWeather_{siteCode}_en.xml
		const pattern = `[^"]*_MSC_CitypageWeather_${this.config.siteCode}_en\\.xml`;
		const match = html.match(new RegExp(`href="(${pattern})"`));

		if (match && match[1]) {
			return this.#getIndexUrl() + match[1];
		}

		return null;
	}

	#parseECTime (timeStr) {
		if (!timeStr || timeStr.length < 14) return new Date();

		const y = parseInt(timeStr.substring(0, 4), 10);
		const m = parseInt(timeStr.substring(4, 6), 10) - 1;
		const d = parseInt(timeStr.substring(6, 8), 10);
		const h = parseInt(timeStr.substring(8, 10), 10);
		const min = parseInt(timeStr.substring(10, 12), 10);
		const s = parseInt(timeStr.substring(12, 14), 10);

		return new Date(y, m, d, h, min, s);
	}

	#convertWeatherType (iconCode) {
		const code = parseInt(iconCode, 10);
		const map = {
			0: "day-sunny",
			1: "day-sunny",
			2: "day-cloudy",
			3: "day-cloudy",
			4: "day-cloudy",
			5: "day-cloudy",
			6: "rain",
			7: "rain-mix",
			8: "snow",
			9: "thunderstorm",
			10: "cloudy",
			11: "showers",
			12: "rain",
			13: "rain",
			14: "rain-mix",
			15: "rain-mix",
			16: "snow",
			17: "snow",
			18: "snow",
			19: "thunderstorm",
			20: "cloudy",
			21: "showers",
			22: "cloudy",
			23: "fog",
			24: "fog",
			25: "rain-mix",
			26: "rain-mix",
			27: "rain-mix",
			28: "rain",
			29: "rain-mix",
			30: "night-clear",
			31: "night-partly-cloudy",
			32: "night-cloudy",
			33: "night-cloudy",
			34: "night-cloudy",
			35: "night-cloudy",
			36: "rain",
			37: "rain-mix",
			38: "snow",
			39: "thunderstorm"
		};
		return map[code] || null;
	}
}

module.exports = EnvCanadaProvider;
