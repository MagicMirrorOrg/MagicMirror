/* global WeatherProvider, WeatherObject, WeatherUtils */

/*
 * This class is a provider for Environment Canada MSC Datamart
 * Note that this is only for Canadian locations and does not require an API key (access is anonymous)
 *
 * EC Documentation at following links:
 * 	https://dd.weather.gc.ca/citypage_weather/schema/
 * 	https://eccc-msc.github.io/open-data/msc-datamart/readme_en/
 *
 * This module supports Canadian locations only and requires 2 additional config parameters:
 *
 * siteCode - the city/town unique identifier for which weather is to be displayed. Format is 's0000000'.
 *
 * provCode - the 2-character province code for the selected city/town.
 *
 * Example: for Toronto, Ontario, the following parameters would be used
 *
 * siteCode: 's0000458',
 * provCode: 'ON'
 *
 * To determine the siteCode and provCode values for a Canadian city/town, look at the Environment Canada document
 * at https://dd.weather.gc.ca/citypage_weather/docs/site_list_en.csv (or site_list_fr.csv). There you will find a table
 * with locations you can search under column B (English Names), with the corresponding siteCode under
 * column A (Codes) and provCode under column C (Province).
 *
 * License to use Environment Canada (EC) data is detailed here:
 * 	https://eccc-msc.github.io/open-data/licence/readme_en/
 */
WeatherProvider.register("envcanada", {
	// Set the name of the provider for debugging and alerting purposes (eg. provide eye-catcher)
	providerName: "Environment Canada",

	// Set the default config properties that is specific to this provider
	defaults: {
		useCorsProxy: true,
		siteCode: "s1234567",
		provCode: "ON"
	},

	/*
	 * Set config values (equates to weather module config values). Also set values pertaining to caching of
	 * Today's temperature forecast (for use in the Forecast functions below)
	 */
	setConfig (config) {
		this.config = config;

		this.todayTempCacheMin = 0;
		this.todayTempCacheMax = 0;
		this.todayCached = false;
		this.cacheCurrentTemp = 999;
	},

	/*
	 * Called when the weather provider is started
	 */
	start () {
		Log.info(`Weather provider: ${this.providerName} started.`);
		this.setFetchedLocation(this.config.location);
	},

	/*
	 * Override the fetchCurrentWeather method to query EC and construct a Current weather object
	 */
	fetchCurrentWeather () {
		this.fetchData(this.getUrl(), "xml")
			.then((data) => {
				if (!data) {
					// Did not receive usable new data.
					return;
				}
				const currentWeather = this.generateWeatherObjectFromCurrentWeather(data);

				this.setCurrentWeather(currentWeather);
			})
			.catch(function (request) {
				Log.error("Could not load EnvCanada site data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	/*
	 * Override the fetchWeatherForecast method to query EC and construct Forecast weather objects
	 */
	fetchWeatherForecast () {
		this.fetchData(this.getUrl(), "xml")
			.then((data) => {
				if (!data) {
					// Did not receive usable new data.
					return;
				}
				const forecastWeather = this.generateWeatherObjectsFromForecast(data);

				this.setWeatherForecast(forecastWeather);
			})
			.catch(function (request) {
				Log.error("Could not load EnvCanada forecast data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	/*
	 * Override the fetchWeatherHourly method to query EC and construct Forecast weather objects
	 */
	fetchWeatherHourly () {
		this.fetchData(this.getUrl(), "xml")
			.then((data) => {
				if (!data) {
					// Did not receive usable new data.
					return;
				}
				const hourlyWeather = this.generateWeatherObjectsFromHourly(data);

				this.setWeatherHourly(hourlyWeather);
			})
			.catch(function (request) {
				Log.error("Could not load EnvCanada hourly data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	/*
	 * Build the EC URL based on the Site Code and Province Code specified in the config params. Note that the
	 * URL defaults to the English version simply because there is no language dependency in the data
	 * being accessed. This is only pertinent when using the EC data elements that contain a textual forecast.
	 */
	getUrl () {
		return `https://dd.weather.gc.ca/citypage_weather/xml/${this.config.provCode}/${this.config.siteCode}_e.xml`;
	},

	/*
	 * Generate a WeatherObject based on current EC weather conditions
	 */
	generateWeatherObjectFromCurrentWeather (ECdoc) {
		const currentWeather = new WeatherObject();

		/*
		 * There are instances where EC will update weather data and current temperature will not be
		 * provided. While this is a defect in the EC systems, we need to accommodate to avoid a current temp
		 * of NaN being displayed. Therefore... whenever we get a valid current temp from EC, we will cache
		 * the value. Whenever EC data is missing current temp, we will provide the cached value
		 * instead. This is reasonable since the cached value will typically be accurate within the previous
		 * hour. The only time this does not work as expected is when MM is restarted and the first query to
		 * EC finds no current temp. In this scenario, MM will end up displaying a current temp of null;
		 */
		if (ECdoc.querySelector("siteData currentConditions temperature").textContent) {
			currentWeather.temperature = ECdoc.querySelector("siteData currentConditions temperature").textContent;
			this.cacheCurrentTemp = currentWeather.temperature;
		} else {
			currentWeather.temperature = this.cacheCurrentTemp;
		}

		currentWeather.windSpeed = WeatherUtils.convertWindToMs(ECdoc.querySelector("siteData currentConditions wind speed").textContent);

		currentWeather.windFromDirection = ECdoc.querySelector("siteData currentConditions wind bearing").textContent;

		currentWeather.humidity = ECdoc.querySelector("siteData currentConditions relativeHumidity").textContent;

		/*
		 * Ensure showPrecipitationAmount is forced to false. EC does not really provide POP for current day
		 * and this feature for the weather module (current only) is sort of broken in that it wants
		 * to say POP but will display precip as an accumulated amount vs. a percentage.
		 */
		this.config.showPrecipitationAmount = false;

		/*
		 * If the module config wants to showFeelsLike... default to the current temperature.
		 * Check for EC wind chill and humidex values and overwrite the feelsLikeTemp value.
		 * This assumes that the EC current conditions will never contain both a wind chill
		 * and humidex temperature.
		 */
		if (this.config.showFeelsLike) {
			currentWeather.feelsLikeTemp = currentWeather.temperature;

			if (ECdoc.querySelector("siteData currentConditions windChill")) {
				currentWeather.feelsLikeTemp = ECdoc.querySelector("siteData currentConditions windChill").textContent;
			}

			if (ECdoc.querySelector("siteData currentConditions humidex")) {
				currentWeather.feelsLikeTemp = ECdoc.querySelector("siteData currentConditions humidex").textContent;
			}
		}

		// Need to map EC weather icon to MM weatherType values
		currentWeather.weatherType = this.convertWeatherType(ECdoc.querySelector("siteData currentConditions iconCode").textContent);

		// Capture the sunrise and sunset values from EC data
		const sunList = ECdoc.querySelectorAll("siteData riseSet dateTime");

		currentWeather.sunrise = moment(sunList[1].querySelector("timeStamp").textContent, "YYYYMMDDhhmmss");
		currentWeather.sunset = moment(sunList[3].querySelector("timeStamp").textContent, "YYYYMMDDhhmmss");

		return currentWeather;
	},

	/*
	 * Generate an array of WeatherObjects based on EC weather forecast
	 */
	generateWeatherObjectsFromForecast (ECdoc) {
		// Declare an array to hold each day's forecast object
		const days = [];

		const weather = new WeatherObject();

		const foreBaseDates = ECdoc.querySelectorAll("siteData forecastGroup dateTime");
		const baseDate = foreBaseDates[1].querySelector("timeStamp").textContent;

		weather.date = moment(baseDate, "YYYYMMDDhhmmss");

		const foreGroup = ECdoc.querySelectorAll("siteData forecastGroup forecast");

		weather.precipitationAmount = null;

		/*
		 * The EC forecast is held in a 12-element array - Elements 0 to 11 - with each day encompassing
		 * 2 elements. the first element for a day details the Today (daytime) forecast while the second
		 * element details the Tonight (nightime) forecast. Element 0 is always for the current day.
		 *
		 * However... the forecast is somewhat 'rolling'.
		 *
		 * If the EC forecast is queried in the morning, then Element 0 will contain Current
		 * Today and Element 1 will contain Current Tonight. From there, the next 5 days of forecast will be
		 * contained in Elements 2/3, 4/5, 6/7, 8/9, and 10/11. This module will create a 6-day forecast using
		 * all of these Elements.
		 *
		 * But, if the EC forecast is queried in late afternoon, the Current Today forecast will be rolled
		 * off and Element 0 will contain Current Tonight. From there, the next 5 days will be contained in
		 * Elements 1/2, 3/4, 5/6, 7/8, and 9/10. As well, Elelement 11 will contain a forecast for a 6th day,
		 * but only for the Today portion (not Tonight). This module will create a 6-day forecast using
		 * Elements 0 to 11, and will ignore the additional Todat forecast in Element 11.
		 *
		 * We need to determine if Element 0 is showing the forecast for Current Today or Current Tonight.
		 * This is required to understand how Min and Max temperature will be determined, and to understand
		 * where the next day's (aka Tomorrow's) forecast is located in the forecast array.
		 */
		let nextDay = 0;
		let lastDay = 0;
		const currentTemp = ECdoc.querySelector("siteData currentConditions temperature").textContent;

		// If the first Element is Current Today, look at Current Today and Current Tonight for the current day.
		if (foreGroup[0].querySelector("period[textForecastName='Today']")) {
			this.todaytempCacheMin = 0;
			this.todaytempCacheMax = 0;
			this.todayCached = true;

			this.setMinMaxTemps(weather, foreGroup, 0, true, currentTemp);

			this.setPrecipitation(weather, foreGroup, 0);

			/*
			 * Set the Element number that will reflect where the next day's forecast is located. Also set
			 * the Element number where the end of the forecast will be. This is important because of the
			 * rolling nature of the EC forecast. In the current scenario (Today and Tonight are present
			 * in elements 0 and 11, we know that we will have 6 full days of forecasts and we will use
			 * them. We will set lastDay such that we iterate through all 12 elements of the forecast.
			 */
			nextDay = 2;
			lastDay = 12;
		}

		// If the first Element is Current Tonight, look at Tonight only for the current day.
		if (foreGroup[0].querySelector("period[textForecastName='Tonight']")) {
			this.setMinMaxTemps(weather, foreGroup, 0, false, currentTemp);

			this.setPrecipitation(weather, foreGroup, 0);

			/*
			 * Set the Element number that will reflect where the next day's forecast is located. Also set
			 * the Element number where the end of the forecast will be. This is important because of the
			 * rolling nature of the EC forecast. In the current scenario (only Current Tonight is present
			 * in Element 0, we know that we will have 6 full days of forecasts PLUS a half-day and
			 * forecast in the final element. Because we will only use full day forecasts, we set the
			 * lastDay number to ensure we ignore that final half-day (in forecast Element 11).
			 */
			nextDay = 1;
			lastDay = 11;
		}

		/*
		 * Need to map EC weather icon to MM weatherType values. Always pick the first Element's icon to
		 * reflect either Today or Tonight depending on what the forecast is showing in Element 0.
		 */
		weather.weatherType = this.convertWeatherType(foreGroup[0].querySelector("abbreviatedForecast iconCode").textContent);

		// Push the weather object into the forecast array.
		days.push(weather);

		/*
		 * Now do the rest of the forecast starting at nextDay. We will process each day using 2 EC
		 * forecast Elements. This will address the fact that the EC forecast always includes Today and
		 * Tonight for each day. This is why we iterate through the forecast by a a count of 2, with each
		 * iteration looking at the current Element and the next Element.
		 */
		let lastDate = moment(baseDate, "YYYYMMDDhhmmss");

		for (let stepDay = nextDay; stepDay < lastDay; stepDay += 2) {
			let weather = new WeatherObject();

			// Add 1 to the date to reflect the current forecast day we are building
			lastDate = lastDate.add(1, "day");
			weather.date = moment(lastDate);

			/*
			 * Capture the temperatures for the current Element and the next Element in order to set
			 * the Min and Max temperatures for the forecast
			 */
			this.setMinMaxTemps(weather, foreGroup, stepDay, true, currentTemp);

			weather.precipitationAmount = null;

			this.setPrecipitation(weather, foreGroup, stepDay);

			// Need to map EC weather icon to MM weatherType values. Always pick the first Element icon.
			weather.weatherType = this.convertWeatherType(foreGroup[stepDay].querySelector("abbreviatedForecast iconCode").textContent);

			// Push the weather object into the forecast array.
			days.push(weather);
		}

		return days;
	},

	/*
	 * Generate an array of WeatherObjects based on EC hourly weather forecast
	 */
	generateWeatherObjectsFromHourly (ECdoc) {
		// Declare an array to hold each hour's forecast object
		const hours = [];

		// Get local timezone UTC offset so that each hourly time can be calculated properly
		const baseHours = ECdoc.querySelectorAll("siteData hourlyForecastGroup dateTime");
		const hourOffset = baseHours[1].getAttribute("UTCOffset");

		/*
		 * The EC hourly forecast is held in a 24-element array - Elements 0 to 23 - with Element 0 holding
		 * the forecast for the next 'on the hour' timeslot. This means the array is a rolling 24 hours.
		 */
		const hourGroup = ECdoc.querySelectorAll("siteData hourlyForecastGroup hourlyForecast");

		for (let stepHour = 0; stepHour < 24; stepHour += 1) {
			const weather = new WeatherObject();

			// Determine local time by applying UTC offset to the forecast timestamp
			const foreTime = moment(hourGroup[stepHour].getAttribute("dateTimeUTC"), "YYYYMMDDhhmmss");
			const currTime = foreTime.add(hourOffset, "hours");
			weather.date = moment(currTime);

			// Capture the temperature
			weather.temperature = hourGroup[stepHour].querySelector("temperature").textContent;

			// Capture Likelihood of Precipitation (LOP) and unit-of-measure values
			const precipLOP = hourGroup[stepHour].querySelector("lop").textContent * 1.0;

			if (precipLOP > 0) {
				weather.precipitationProbability = precipLOP;
			}

			// Need to map EC weather icon to MM weatherType values. Always pick the first Element icon.
			weather.weatherType = this.convertWeatherType(hourGroup[stepHour].querySelector("iconCode").textContent);

			// Push the weather object into the forecast array.
			hours.push(weather);
		}

		return hours;
	},

	/*
	 * Determine Min and Max temp based on a supplied Forecast Element index and a boolen that denotes if
	 * the next Forecast element should be considered - i.e. look at Today *and* Tonight vs.Tonight-only
	 */
	setMinMaxTemps (weather, foreGroup, today, fullDay, currentTemp) {
		const todayTemp = foreGroup[today].querySelector("temperatures temperature").textContent;

		const todayClass = foreGroup[today].querySelector("temperatures temperature").getAttribute("class");

		/*
		 * The following logic is largely aimed at accommodating the Current day's forecast whereby we
		 * can have either Current Today+Current Tonight or only Current Tonight.
		 *
		 * If fullDay is false, then we only have Tonight for the current day's forecast - meaning we have
		 * lost a min or max temp value for the day. Therefore, we will see if we were able to cache the the
		 * Today forecast for the current day. If we have, we will use them. If we do not have the cached values,
		 * it means that MM or the Computer has been restarted since the time EC rolled off Today from the
		 * forecast. In this scenario, we will simply default to the Current Conditions temperature and then
		 * check the Tonight temperature.x
		 */
		if (fullDay === false) {
			if (this.todayCached === true) {
				weather.minTemperature = this.todayTempCacheMin;
				weather.maxTemperature = this.todayTempCacheMax;
			} else {
				weather.minTemperature = currentTemp;
				weather.maxTemperature = weather.minTemperature;
			}
		}

		/*
		 * We will check to see if the current Element's temperature is Low or High and set weather values
		 * accordingly. We will also check the condition where fullDay is true *and* we are looking at forecast
		 * element 0. This is a special case where we will cache temperature values so that we have them later
		 * in the current day when the Current Today element rolls off and we have Current Tonight only.
		 */
		if (todayClass === "low") {
			weather.minTemperature = todayTemp;
			if (today === 0 && fullDay === true) {
				this.todayTempCacheMin = weather.minTemperature;
			}
		}

		if (todayClass === "high") {
			weather.maxTemperature = todayTemp;
			if (today === 0 && fullDay === true) {
				this.todayTempCacheMax = weather.maxTemperature;
			}
		}

		const nextTemp = foreGroup[today + 1].querySelector("temperatures temperature").textContent;

		const nextClass = foreGroup[today + 1].querySelector("temperatures temperature").getAttribute("class");

		if (fullDay === true) {
			if (nextClass === "low") {
				weather.minTemperature = nextTemp;
			}

			if (nextClass === "high") {
				weather.maxTemperature = nextTemp;
			}
		}
	},

	/*
	 * Check for a Precipitation forecast. EC can provide a forecast in 2 ways: either an accumulation figure
	 * or a POP percentage. If there is a POP, then that is what the module will show. If there is an accumulation,
	 * then it will be displayed ONLY if no POP is present.
	 *
	 * POP Logic: By default, we want to show the POP for 'daytime' since we are presuming that is what
	 * people are more interested in seeing. While EC provides a separate POP for daytime and nightime portions
	 * of each day, the weather module does not really allow for that view of a daily forecast. There we will
	 * ignore any nightime portion. There is an exception however! For the Current day, the EC data will only show
	 * the nightime forecast after a certain point in the afternoon. As such, we will be showing the nightime POP
	 * (if one exists) in that specific scenario.
	 *
	 * Accumulation Logic: Similar to POP, we want to show accumulation for 'daytime' since we presume that is what
	 * people are interested in seeing. While EC provides a separate accumulation for daytime and nightime portions
	 * of each day, the weather module does not really allow for that view of a daily forecast. There we will
	 * ignore any nightime portion. There is an exception however! For the Current day, the EC data will only show
	 * the nightime forecast after a certain point in that specific scenario.
	 */
	setPrecipitation (weather, foreGroup, today) {
		if (foreGroup[today].querySelector("precipitation accumulation")) {
			weather.precipitationAmount = foreGroup[today].querySelector("precipitation accumulation amount").textContent * 1.0;
			weather.precipitationUnits = foreGroup[today].querySelector("precipitation accumulation amount").getAttribute("units");
		}

		// Check Today element for POP
		const precipPOP = foreGroup[today].querySelector("abbreviatedForecast pop").textContent * 1.0;
		if (precipPOP > 0) {
			weather.precipitationProbability = precipPOP;
		}
	},

	/*
	 * Convert the icons to a more usable name.
	 */
	convertWeatherType (weatherType) {
		const weatherTypes = {
			"00": "day-sunny",
			"01": "day-sunny",
			"02": "day-sunny-overcast",
			"03": "day-cloudy",
			"04": "day-cloudy",
			"05": "day-cloudy",
			"06": "day-sprinkle",
			"07": "day-showers",
			"08": "day-snow",
			"09": "day-thunderstorm",
			10: "cloud",
			11: "showers",
			12: "rain",
			13: "rain",
			14: "sleet",
			15: "sleet",
			16: "snow",
			17: "snow",
			18: "snow",
			19: "thunderstorm",
			20: "cloudy",
			21: "cloudy",
			22: "day-cloudy",
			23: "day-haze",
			24: "fog",
			25: "snow-wind",
			26: "sleet",
			27: "sleet",
			28: "rain",
			29: "na",
			30: "night-clear",
			31: "night-clear",
			32: "night-partly-cloudy",
			33: "night-alt-cloudy",
			34: "night-alt-cloudy",
			35: "night-partly-cloudy",
			36: "night-alt-showers",
			37: "night-rain-mix",
			38: "night-alt-snow",
			39: "night-thunderstorm",
			40: "snow-wind",
			41: "tornado",
			42: "tornado",
			43: "windy",
			44: "smoke",
			45: "sandstorm",
			46: "thunderstorm",
			47: "thunderstorm",
			48: "tornado"
		};

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	}
});
