/* global WeatherProvider, WeatherObject */

/*
 * This class is a provider for Open-Meteo,
 * see https://open-meteo.com/
 */

// https://www.bigdatacloud.com/docs/api/free-reverse-geocode-to-city-api
const GEOCODE_BASE = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";

WeatherProvider.register("openmeteo", {

	/*
	 * Set the name of the provider.
	 * Not strictly required, but helps for debugging.
	 */
	providerName: "Open-Meteo",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiBase: OPEN_METEO_BASE,
		lat: 0,
		lon: 0,
		pastDays: 0,
		type: "current"
	},

	// https://open-meteo.com/en/docs
	hourlyParams: [
		// Air temperature at 2 meters above ground
		"temperature_2m",
		// Relative humidity at 2 meters above ground
		"relativehumidity_2m",
		// Dew point temperature at 2 meters above ground
		"dewpoint_2m",
		// Apparent temperature is the perceived feels-like temperature combining wind chill factor, relative humidity and solar radiation
		"apparent_temperature",
		// Atmospheric air pressure reduced to mean sea level (msl) or pressure at surface. Typically pressure on mean sea level is used in meteorology. Surface pressure gets lower with increasing elevation.
		"pressure_msl",
		"surface_pressure",
		// Total cloud cover as an area fraction
		"cloudcover",
		// Low level clouds and fog up to 3 km altitude
		"cloudcover_low",
		// Mid level clouds from 3 to 8 km altitude
		"cloudcover_mid",
		// High level clouds from 8 km altitude
		"cloudcover_high",
		// Wind speed at 10, 80, 120 or 180 meters above ground. Wind speed on 10 meters is the standard level.
		"windspeed_10m",
		"windspeed_80m",
		"windspeed_120m",
		"windspeed_180m",
		// Wind direction at 10, 80, 120 or 180 meters above ground
		"winddirection_10m",
		"winddirection_80m",
		"winddirection_120m",
		"winddirection_180m",
		// Gusts at 10 meters above ground as a maximum of the preceding hour
		"windgusts_10m",
		// Shortwave solar radiation as average of the preceding hour. This is equal to the total global horizontal irradiation
		"shortwave_radiation",
		// Direct solar radiation as average of the preceding hour on the horizontal plane and the normal plane (perpendicular to the sun)
		"direct_radiation",
		"direct_normal_irradiance",
		// Diffuse solar radiation as average of the preceding hour
		"diffuse_radiation",
		// Vapor Pressure Deificit (VPD) in kilopascal (kPa). For high VPD (>1.6), water transpiration of plants increases. For low VPD (<0.4), transpiration decreases
		"vapor_pressure_deficit",
		// Evapotranspration from land surface and plants that weather models assumes for this location. Available soil water is considered. 1 mm evapotranspiration per hour equals 1 liter of water per spare meter.
		"evapotranspiration",
		// ET₀ Reference Evapotranspiration of a well watered grass field. Based on FAO-56 Penman-Monteith equations ET₀ is calculated from temperature, wind speed, humidity and solar radiation. Unlimited soil water is assumed. ET₀ is commonly used to estimate the required irrigation for plants.
		"et0_fao_evapotranspiration",
		// Total precipitation (rain, showers, snow) sum of the preceding hour
		"precipitation",
		// Precipitation Probability
		"precipitation_probability",
		// UV index
		"uv_index",
		// Snowfall amount of the preceding hour in centimeters. For the water equivalent in millimeter, divide by 7. E.g. 7 cm snow = 10 mm precipitation water equivalent
		"snowfall",
		// Rain from large scale weather systems of the preceding hour in millimeter
		"rain",
		// Showers from convective precipitation in millimeters from the preceding hour
		"showers",
		// Weather condition as a numeric code. Follow WMO weather interpretation codes.
		"weathercode",
		// Snow depth on the ground
		"snow_depth",
		// Altitude above sea level of the 0°C level
		"freezinglevel_height",
		// Temperature in the soil at 0, 6, 18 and 54 cm depths. 0 cm is the surface temperature on land or water surface temperature on water.
		"soil_temperature_0cm",
		"soil_temperature_6cm",
		"soil_temperature_18cm",
		"soil_temperature_54cm",
		// Average soil water content as volumetric mixing ratio at 0-1, 1-3, 3-9, 9-27 and 27-81 cm depths.
		"soil_moisture_0_1cm",
		"soil_moisture_1_3cm",
		"soil_moisture_3_9cm",
		"soil_moisture_9_27cm",
		"soil_moisture_27_81cm"
	],

	dailyParams: [
		// Maximum and minimum daily air temperature at 2 meters above ground
		"temperature_2m_max",
		"temperature_2m_min",
		// Maximum and minimum daily apparent temperature
		"apparent_temperature_min",
		"apparent_temperature_max",
		// Sum of daily precipitation (including rain, showers and snowfall)
		"precipitation_sum",
		// Sum of daily rain
		"rain_sum",
		// Sum of daily showers
		"showers_sum",
		// Sum of daily snowfall
		"snowfall_sum",
		// The number of hours with rain
		"precipitation_hours",
		// The most severe weather condition on a given day
		"weathercode",
		// Sun rise and set times
		"sunrise",
		"sunset",
		// Maximum wind speed and gusts on a day
		"windspeed_10m_max",
		"windgusts_10m_max",
		// Dominant wind direction
		"winddirection_10m_dominant",
		// The sum of solar radiation on a given day in Megajoules
		"shortwave_radiation_sum",
		//UV Index
		"uv_index_max",
		// Daily sum of ET₀ Reference Evapotranspiration of a well watered grass field
		"et0_fao_evapotranspiration"
	],

	fetchedLocation () {
		return this.fetchedLocationName || "";
	},

	fetchCurrentWeather () {
		this.fetchData(this.getUrl())
			.then((data) => this.parseWeatherApiResponse(data))
			.then((parsedData) => {
				if (!parsedData) {
					// No usable data?
					return;
				}

				const currentWeather = this.generateWeatherDayFromCurrentWeather(parsedData);
				this.setCurrentWeather(currentWeather);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	fetchWeatherForecast () {
		this.fetchData(this.getUrl())
			.then((data) => this.parseWeatherApiResponse(data))
			.then((parsedData) => {
				if (!parsedData) {
					// No usable data?
					return;
				}

				const dailyForecast = this.generateWeatherObjectsFromForecast(parsedData);
				this.setWeatherForecast(dailyForecast);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	fetchWeatherHourly () {
		this.fetchData(this.getUrl())
			.then((data) => this.parseWeatherApiResponse(data))
			.then((parsedData) => {
				if (!parsedData) {
					// No usable data?
					return;
				}

				const hourlyForecast = this.generateWeatherObjectsFromHourly(parsedData);
				this.setWeatherHourly(hourlyForecast);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	/**
	 * Overrides method for setting config to check if endpoint is correct for hourly
	 * @param {object} config The configuration object
	 */
	setConfig (config) {
		this.config = {
			lang: config.lang ?? "en",
			...this.defaults,
			...config
		};

		// Set properly maxNumberOfDays and max Entries properties according to config and value ranges allowed in the documentation
		const maxEntriesLimit = ["daily", "forecast"].includes(this.config.type) ? 7 : this.config.type === "hourly" ? 48 : 0;
		if (this.config.hasOwnProperty("maxNumberOfDays") && !isNaN(parseFloat(this.config.maxNumberOfDays))) {
			const daysFactor = ["daily", "forecast"].includes(this.config.type) ? 1 : this.config.type === "hourly" ? 24 : 0;
			this.config.maxEntries = Math.max(1, Math.min(Math.round(parseFloat(this.config.maxNumberOfDays)) * daysFactor, maxEntriesLimit));
			this.config.maxNumberOfDays = Math.ceil(this.config.maxEntries / Math.max(1, daysFactor));
		}
		this.config.maxEntries = Math.max(1, Math.min(this.config.maxEntries, maxEntriesLimit));

		if (!this.config.type) {
			Log.error("type not configured and could not resolve it");
		}

		this.fetchLocation();
	},

	// Generate valid query params to perform the request
	getQueryParameters () {
		let params = {
			latitude: this.config.lat,
			longitude: this.config.lon,
			timeformat: "unixtime",
			timezone: "auto",
			past_days: this.config.pastDays ?? 0,
			daily: this.dailyParams,
			hourly: this.hourlyParams,
			// Fixed units as metric
			temperature_unit: "celsius",
			windspeed_unit: "ms",
			precipitation_unit: "mm"
		};

		const startDate = moment().startOf("day");
		const endDate = moment(startDate)
			.add(Math.max(0, Math.min(7, this.config.maxNumberOfDays)), "days")
			.endOf("day");

		params.start_date = startDate.format("YYYY-MM-DD");

		switch (this.config.type) {
			case "hourly":
			case "daily":
			case "forecast":
				params.end_date = endDate.format("YYYY-MM-DD");
				break;
			case "current":
				params.current_weather = true;
				params.end_date = params.start_date;
				break;
			default:
				// Failsafe
				return "";
		}

		return Object.keys(params)
			.filter((key) => (!!params[key]))
			.map((key) => {
				switch (key) {
					case "hourly":
					case "daily":
						return `${encodeURIComponent(key)}=${params[key].join(",")}`;
					default:
						return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
				}
			})
			.join("&");
	},

	// Create a URL from the config and base URL.
	getUrl () {
		return `${this.config.apiBase}/forecast?${this.getQueryParameters()}`;
	},

	// Transpose hourly and daily data matrices
	transposeDataMatrix (data) {
		return data.time.map((_, index) => Object.keys(data).reduce((row, key) => {
			return {
				...row,
				// Parse time values as momentjs instances
				[key]: ["time", "sunrise", "sunset"].includes(key) ? moment.unix(data[key][index]) : data[key][index]
			};
		}, {}));
	},

	// Sanitize and validate API response
	parseWeatherApiResponse (data) {
		const validByType = {
			current: data.current_weather && data.current_weather.time,
			hourly: data.hourly && data.hourly.time && Array.isArray(data.hourly.time) && data.hourly.time.length > 0,
			daily: data.daily && data.daily.time && Array.isArray(data.daily.time) && data.daily.time.length > 0
		};
		// backwards compatibility
		const type = ["daily", "forecast"].includes(this.config.type) ? "daily" : this.config.type;

		if (!validByType[type]) return;

		switch (type) {
			case "current":
				if (!validByType.daily && !validByType.hourly) {
					return;
				}
				break;
			case "hourly":
			case "daily":
				break;
			default:
				return;
		}

		for (const key of ["hourly", "daily"]) {
			if (typeof data[key] === "object") {
				data[key] = this.transposeDataMatrix(data[key]);
			}
		}

		if (data.current_weather) {
			data.current_weather.time = moment.unix(data.current_weather.time);
		}

		return data;
	},

	// Reverse geocoding from latitude and longitude provided
	fetchLocation () {
		this.fetchData(`${GEOCODE_BASE}?latitude=${this.config.lat}&longitude=${this.config.lon}&localityLanguage=${this.config.lang}`)
			.then((data) => {
				if (!data || !data.city) {
					// No usable data?
					return;
				}
				this.fetchedLocationName = `${data.city}, ${data.principalSubdivisionCode}`;
			})
			.catch((request) => {
				Log.error("Could not load data ... ", request);
			});
	},

	// Implement WeatherDay generator.
	generateWeatherDayFromCurrentWeather (weather) {

		/**
		 * Since some units comes from API response "splitted" into daily, hourly and current_weather
		 * every time you request it, you have to ensure to get the data from the right place every time.
		 * For the current weather case, the response have the following structure (after transposing):
		 * ```
		 * {
		 *   current_weather: { ...<some current weather here> },
		 * 	 hourly: [
		 * 	   0: {...<data for hour zero here> },
		 * 	   1: {...<data for hour one here> },
		 *     ...
		 *   ],
		 *   daily: [
		 * 	   {...<summary data for current day here> },
		 *   ]
		 * }
		 * ```
		 * Some data should be returned from `hourly` array data when the index matches the current hour,
		 * some data from the first and only one object received in `daily` array and some from the
		 * `current_weather` object.
		 */
		const h = moment().hour();
		const currentWeather = new WeatherObject();

		currentWeather.date = weather.current_weather.time;
		currentWeather.windSpeed = weather.current_weather.windspeed;
		currentWeather.windFromDirection = weather.current_weather.winddirection;
		currentWeather.sunrise = weather.daily[0].sunrise;
		currentWeather.sunset = weather.daily[0].sunset;
		currentWeather.temperature = parseFloat(weather.current_weather.temperature);
		currentWeather.minTemperature = parseFloat(weather.daily[0].temperature_2m_min);
		currentWeather.maxTemperature = parseFloat(weather.daily[0].temperature_2m_max);
		currentWeather.weatherType = this.convertWeatherType(weather.current_weather.weathercode, currentWeather.isDayTime());
		currentWeather.humidity = parseFloat(weather.hourly[h].relativehumidity_2m);
		currentWeather.rain = parseFloat(weather.hourly[h].rain);
		currentWeather.snow = parseFloat(weather.hourly[h].snowfall * 10);
		currentWeather.precipitationAmount = parseFloat(weather.hourly[h].precipitation);
		currentWeather.precipitationProbability = parseFloat(weather.hourly[h].precipitation_probability);
		currentWeather.uv_index = parseFloat(weather.hourly[h].uv_index);

		return currentWeather;
	},

	// Implement WeatherForecast generator.
	generateWeatherObjectsFromForecast (weathers) {
		const days = [];

		weathers.daily.forEach((weather) => {
			const currentWeather = new WeatherObject();

			currentWeather.date = weather.time;
			currentWeather.windSpeed = weather.windspeed_10m_max;
			currentWeather.windFromDirection = weather.winddirection_10m_dominant;
			currentWeather.sunrise = weather.sunrise;
			currentWeather.sunset = weather.sunset;
			currentWeather.temperature = parseFloat((weather.temperature_2m_max + weather.temperature_2m_min) / 2);
			currentWeather.minTemperature = parseFloat(weather.temperature_2m_min);
			currentWeather.maxTemperature = parseFloat(weather.temperature_2m_max);
			currentWeather.weatherType = this.convertWeatherType(weather.weathercode, true);
			currentWeather.rain = parseFloat(weather.rain_sum);
			currentWeather.snow = parseFloat(weather.snowfall_sum * 10);
			currentWeather.precipitationAmount = parseFloat(weather.precipitation_sum);
			currentWeather.precipitationProbability = parseFloat(weather.precipitation_hours * 100 / 24);
			currentWeather.uv_index = parseFloat(weather.uv_index_max);

			days.push(currentWeather);
		});

		return days;
	},

	// Implement WeatherHourly generator.
	generateWeatherObjectsFromHourly (weathers) {
		const hours = [];
		const now = moment();

		weathers.hourly.forEach((weather, i) => {
			if ((hours.length === 0 && weather.time <= now) || hours.length >= this.config.maxEntries) {
				return;
			}

			const currentWeather = new WeatherObject();
			const h = Math.ceil((i + 1) / 24) - 1;

			currentWeather.date = weather.time;
			currentWeather.windSpeed = weather.windspeed_10m;
			currentWeather.windFromDirection = weather.winddirection_10m;
			currentWeather.sunrise = weathers.daily[h].sunrise;
			currentWeather.sunset = weathers.daily[h].sunset;
			currentWeather.temperature = parseFloat(weather.temperature_2m);
			currentWeather.minTemperature = parseFloat(weathers.daily[h].temperature_2m_min);
			currentWeather.maxTemperature = parseFloat(weathers.daily[h].temperature_2m_max);
			currentWeather.weatherType = this.convertWeatherType(weather.weathercode, currentWeather.isDayTime());
			currentWeather.humidity = parseFloat(weather.relativehumidity_2m);
			currentWeather.rain = parseFloat(weather.rain);
			currentWeather.snow = parseFloat(weather.snowfall * 10);
			currentWeather.precipitationAmount = parseFloat(weather.precipitation);
			currentWeather.precipitationProbability = parseFloat(weather.precipitation_probability);
			currentWeather.uv_index = parseFloat(weather.uv_index);

			hours.push(currentWeather);
		});

		return hours;
	},

	// Map icons from Dark Sky to our icons.
	convertWeatherType (weathercode, isDayTime) {
		const weatherConditions = {
			0: "clear",
			1: "mainly-clear",
			2: "partly-cloudy",
			3: "overcast",
			45: "fog",
			48: "depositing-rime-fog",
			51: "drizzle-light-intensity",
			53: "drizzle-moderate-intensity",
			55: "drizzle-dense-intensity",
			56: "freezing-drizzle-light-intensity",
			57: "freezing-drizzle-dense-intensity",
			61: "rain-slight-intensity",
			63: "rain-moderate-intensity",
			65: "rain-heavy-intensity",
			66: "freezing-rain-light-heavy-intensity",
			67: "freezing-rain-heavy-intensity",
			71: "snow-fall-slight-intensity",
			73: "snow-fall-moderate-intensity",
			75: "snow-fall-heavy-intensity",
			77: "snow-grains",
			80: "rain-showers-slight",
			81: "rain-showers-moderate",
			82: "rain-showers-violent",
			85: "snow-showers-slight",
			86: "snow-showers-heavy",
			95: "thunderstorm",
			96: "thunderstorm-slight-hail",
			99: "thunderstorm-heavy-hail"
		};

		if (!Object.keys(weatherConditions).includes(`${weathercode}`)) return null;

		switch (weatherConditions[`${weathercode}`]) {
			case "clear":
				return isDayTime ? "day-sunny" : "night-clear";
			case "mainly-clear":
			case "partly-cloudy":
				return isDayTime ? "day-cloudy" : "night-alt-cloudy";
			case "overcast":
				return isDayTime ? "day-sunny-overcast" : "night-alt-partly-cloudy";
			case "fog":
			case "depositing-rime-fog":
				return isDayTime ? "day-fog" : "night-fog";
			case "drizzle-light-intensity":
			case "rain-slight-intensity":
			case "rain-showers-slight":
				return isDayTime ? "day-sprinkle" : "night-sprinkle";
			case "drizzle-moderate-intensity":
			case "rain-moderate-intensity":
			case "rain-showers-moderate":
				return isDayTime ? "day-showers" : "night-showers";
			case "drizzle-dense-intensity":
			case "rain-heavy-intensity":
			case "rain-showers-violent":
				return isDayTime ? "day-thunderstorm" : "night-thunderstorm";
			case "freezing-rain-light-intensity":
				return isDayTime ? "day-rain-mix" : "night-rain-mix";
			case "freezing-drizzle-light-intensity":
			case "freezing-drizzle-dense-intensity":
				return "snowflake-cold";
			case "snow-grains":
				return isDayTime ? "day-sleet" : "night-sleet";
			case "snow-fall-slight-intensity":
			case "snow-fall-moderate-intensity":
				return isDayTime ? "day-snow-wind" : "night-snow-wind";
			case "snow-fall-heavy-intensity":
			case "freezing-rain-heavy-intensity":
				return isDayTime ? "day-snow-thunderstorm" : "night-snow-thunderstorm";
			case "snow-showers-slight":
			case "snow-showers-heavy":
				return isDayTime ? "day-rain-mix" : "night-rain-mix";
			case "thunderstorm":
				return isDayTime ? "day-thunderstorm" : "night-thunderstorm";
			case "thunderstorm-slight-hail":
				return isDayTime ? "day-sleet" : "night-sleet";
			case "thunderstorm-heavy-hail":
				return isDayTime ? "day-sleet-storm" : "night-sleet-storm";
			default:
				return "na";
		}
	},

	// Define required scripts.
	getScripts () {
		return ["moment.js"];
	}
});
