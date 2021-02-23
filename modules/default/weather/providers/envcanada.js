/* global WeatherProvider, WeatherObject */

/* Magic Mirror
 * Module: Weather
 * Provider: Environment Canada (EC)
 *
 * EC Documentation at following links:
 * 	https://dd.weather.gc.ca/citypage_weather/schema/
 * 	https://eccc-msc.github.io/open-data/msc-datamart/readme_en/
 *
 * Original by Kevin Godin
 *
 * License to use Environment Canada (EC) data is detailed here:
 * 	https://eccc-msc.github.io/open-data/licence/readme_en/
 *
 * This class is a provider for Environment Canada MSC Datamart
 * Note that this is only for Canadian locations and does not require an API key (access is anonymous)
 */

WeatherProvider.register("envcanada", {
	// Set the name of the provider for debugging and alerting purposes (eg. provide eye-catcher)
	providerName: "Environment Canada",

	//
	// Set config values (equates to weather module config values). Also set values pertaining to caching of
	// Today's temperature forecast (for use in the Forecast functions below)
	//
	setConfig: function (config) {
		this.config = config;

		this.todayTempCacheMin = 0;
		this.todayTempCacheMax = 0;
		this.todayCached = false;
	},

	//
	// Called when the weather provider is started
	//
	start: function () {
		Log.info(`Weather provider: ${this.providerName} started.`);
		this.setFetchedLocation(this.config.location);

		// Ensure kmH are ignored since these are custom-handled by this Provider

		this.config.useKmh = false;
	},

	//
	// Override the fetchCurrentWeather method to query EC and construct a Current weather object
	//
	fetchCurrentWeather() {
		this.fetchData(this.getUrl(), "GET")
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

	//
	// Override the fetchWeatherForecast method to query EC and construct Forecast weather objects
	//
	fetchWeatherForecast() {
		this.fetchData(this.getUrl(), "GET")
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

	//
	// Override fetchData function to handle XML document (base function assumes JSON)
	//
	fetchData: function (url, method = "GET", data = null) {
		return new Promise(function (resolve, reject) {
			var request = new XMLHttpRequest();
			request.open(method, url, true);
			request.onreadystatechange = function () {
				if (this.readyState === 4) {
					if (this.status === 200) {
						resolve(this.response);
					} else {
						reject(request);
					}
				}
			};
			request.send();
		});
	},

	//////////////////////////////////////////////////////////////////////////////////
	//
	// Environment Canada methods - not part of the standard Provider methods
	//
	//////////////////////////////////////////////////////////////////////////////////

	//
	// Build the EC URL based on the Site Code and Province Code specified in the config parms. Note that the
	// URL defaults to the Englsih version simply because there is no language dependancy in the data 
	// being accessed. This is only pertinent when using the EC data elements that contain a textual forecast.
	//
	// Also note that access is supported through a proxy service (thingproxy.freeboard.io) to mitigate
	// CORS errors when accessing EC
	//
	getUrl() {
		let path = "https://thingproxy.freeboard.io/fetch/https://dd.weather.gc.ca/citypage_weather/xml/" + this.config.provCode + "/" + this.config.siteCode + "_e.xml";

		return path;
	},

	//
	// Generate a WeatherObject based on current EC weather conditions
	//

	generateWeatherObjectFromCurrentWeather(ECdoc) {
		const currentWeather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits);

		//
		// Convert EC XML doc into JSON for easier manipulation
		//

		var x2js = new X2JS();
		var jsonObj = x2js.xml_str2json(ECdoc);

		//console.info("EC JSON -->" + JSON.stringify(jsonObj,null,4));

		currentWeather.temperature = this.convertTemp(jsonObj.siteData.currentConditions.temperature["__text"]);

		currentWeather.windSpeed = this.convertWind(jsonObj.siteData.currentConditions.wind.speed["__text"]);

		currentWeather.windDirection = jsonObj.siteData.currentConditions.wind.bearing["__text"];

		currentWeather.humidity = jsonObj.siteData.currentConditions.relativeHumidity["__text"];

		// Ensure showPrecipitationAmount is forced to false. EC does not really provide POP for current day
		// and this feature for the weather module (current only) is sort of broken in that it wants
		// to say POP but will display precip as an accumulated amount vs. a percentage.

		this.config.showPrecipitationAmount = false;

		//
		// If the module config wants to showFeelsLike... default to the current temperature. 
		// Check for EC wind chill and humidex values and overwrite the feelsLikeTemp value.
		// This assumes that the EC current conditions will never contain both a wind chill 
		// and humidex temperature.
		//

		if (this.config.showFeelsLike) {
			currentWeather.feelsLikeTemp = currentWeather.temperature;

			if (typeof jsonObj.siteData.currentConditions.windChill !== "undefined") {
				currentWeather.feelsLikeTemp = this.convertTemp(jsonObj.siteData.currentConditions.windChill["__text"]);
			}

			if (typeof jsonObj.siteData.currentConditions.humidex !== "undefined") {
				currentWeather.feelsLikeTemp = this.convertTemp(jsonObj.siteData.currentConditions.humidex["__text"]);
			}
		}

		//
		// Need to map EC weather icon to MM weatherType values
		//

		currentWeather.weatherType = this.convertWeatherType(jsonObj.siteData.currentConditions.iconCode["__text"]);

		//
		// Capture the sunrise and sunset values from EC data
		//

		currentWeather.sunrise = moment(jsonObj.siteData.riseSet.dateTime[1].timeStamp, "YYYYMMDDhhmmss");
		currentWeather.sunset = moment(jsonObj.siteData.riseSet.dateTime[3].timeStamp, "YYYYMMDDhhmmss");

		return currentWeather;
	},

	//
	// Generate an array of WeatherObjects based on EC weather forecast
	//

	generateWeatherObjectsFromForecast(ECdoc) {

		// Declare an array to hold each day's forecast object

		const days = [];

		//
		// Convert EC XML doc into JSON for easier manipulation
		//

		var x2js = new X2JS();
		var jsonObj = x2js.xml_str2json(ECdoc);

		//console.info("EC FORECAST JSON -->" + JSON.stringify(jsonObj,null,4));

		let weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits);

		let baseDate = jsonObj.siteData.forecastGroup.dateTime[1].timeStamp;

		weather.date = moment(baseDate, "YYYYMMDDhhmmss");

		// For simplicity, we will only accumulate precipitation and will not try to break out
		// rain vs snow accumulations

		weather.rain = null;
		weather.snow = null;
		weather.precipitation = null;

		//
		// The EC forecast is held in a 12-element array - Elements 0 to 11 - with each day encompassing
		// 2 elements. the first element for a day details the Today (daytime) forecast while the second
		// element details the Tonight (nightime) forecast. Element 0 is always for the current day. 
		// 
		// However... the forecast is somewhat 'rolling'. 
		//
		// If the EC forecast is queried in the morning, then Element 0 will contain Current 
		// Today and Element 1 will contain Current Tonight. From there, the next 5 days of forecast will be 
		// contained in Elements 2/3, 4/5, 6/7, 8/9, and 10/11. This module will create a 6-day forecast using
		// all of these Elements.
		//
		// But, if the EC forecast is queried in late afternoon, the Current Today forecast will be rolled
		// off and Element 0 will contain Current Tonight. From there, the next 5 days will be contained in
		// Elements 1/2, 3/4, 5/6, 7/8, and 9/10. As well, Elelement 11 will contain a forecast for a 6th day,
		// but only for the Today portion (not Tonight). This module will create a 6-day forecast using 
		// Elements 0 to 11, and will ignore the additional Todat forecast in Element 11.
		//
		// We need to determine if Element 0 is showing the forecast for Current Today or Current Tonight. 
		// This is required to understand how Min and Max temperature will be determined, and to understand
		// where the next day's (aka Tomorrow's) forecast is located in the forecast array.
		//

		var nextDay = 0;
		var lastDay = 0;

		//
		// If the first Element is Current Today, look at Current Today and Current Tonight for the current day.
		//

		if (jsonObj.siteData.forecastGroup.forecast[0].period["_textForecastName"] === "Today") {

			this.todaytempCacheMin = 0;
			this.todaytempCacheMax = 0;
			this.todayCached = true;

			this.setMinMaxTemps(weather, jsonObj, 0, true);

			this.setPrecipitation(weather,jsonObj, 0, true);

			//
			// Set the Element number that will reflect where the next day's forecast is located. Also set
			// the Element number where the end of the forecast will be. This is important because of the
			// rolling nature of the EC forecast. In the current scenario (Today and Tonight are present 
			// in elements 0 and 11, we know that we will have 6 full days of forecasts and we will use
			// them. We will set lastDay such that we iterate through all 12 elements of the forecast.
			//

			nextDay = 2;
			lastDay = 12;
		}

		//
		// If the first Element is Current Tonight, look at Tonight only for the current day.
		//
		if (jsonObj.siteData.forecastGroup.forecast[0].period["_textForecastName"] === "Tonight") {

			this.setMinMaxTemps(weather, jsonObj, 0, false);

			this.setPrecipitation(weather,jsonObj, 0, false);

			//
			// Set the Element number that will reflect where the next day's forecast is located. Also set
			// the Element number where the end of the forecast will be. This is important because of the
			// rolling nature of the EC forecast. In the current scenario (only Current Tonight is present 
			// in Element 0, we know that we will have 6 full days of forecasts PLUS a half-day and 
			// forecast in the final element. Because we will only use full day forecasts, we set the
			// lastDay number to ensure we ignore that final half-day (in forecast Element 11).
			//

			nextDay = 1;
			lastDay = 11;
		}

		//
		// Need to map EC weather icon to MM weatherType values. Always pick the first Element's icon to
		// reflect either Today or Tonight depending on what the forecast is showing in Element 0.
		//

		weather.weatherType = this.convertWeatherType(jsonObj.siteData.forecastGroup.forecast[0].abbreviatedForecast.iconCode["__text"]);

		// Push the weather object into the forecast array.

		days.push(weather);

		//
		// Now do the the rest of the forecast starting at nextDay. We will process each day using 2 EC
		// forecast Elements. This will address the fact that the EC forecast always includes Today and
		// Tonight for each day. This is why we iterate through the forecast by a a count of 2, with each
		// iteration looking at the current Element and the next Element.
		//

		var lastDate = moment(baseDate, "YYYYMMDDhhmmss");

		for (let stepDay = nextDay; stepDay < lastDay; stepDay += 2) {

			let weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits);

			// Add 1 to the date to reflect the current forecast day we are building

			lastDate = lastDate.add(1, "day");
			weather.date = moment(lastDate, "X");

			// Capture the temperatures for the current Element and the next Element in order to set
			// the Min and Max temperatures for the forecast

			this.setMinMaxTemps(weather, jsonObj, stepDay, true);

			weather.rain = null;
			weather.snow = null;
			weather.precipitation = null;

			this.setPrecipitation(weather,jsonObj, stepDay, true);

			//
			// Need to map EC weather icon to MM weatherType values. Always pick the first Element icon.
			//

			weather.weatherType = this.convertWeatherType(jsonObj.siteData.forecastGroup.forecast[stepDay].abbreviatedForecast.iconCode["__text"]);

			// Push the weather object into the forecast array.

			days.push(weather);
		}

		return days;

	},

	//
	// Determine Min and Max temp based on a supplied Forecast Element index and a boolen that denotes if
	// the next Forecast element should be considered - i.e. look at Today *and* Tonight vs.Tonight-only
	//

	setMinMaxTemps(weather, jsonObj, today, fullDay) {

		var todayClass = jsonObj.siteData.forecastGroup.forecast[today].temperatures.temperature["_class"];
		var todayTemp = jsonObj.siteData.forecastGroup.forecast[today].temperatures.temperature["__text"];

		//
		// The following logic is largely aimed at accommodating the Current day's forecast whereby we
		// can have either Current Today+Current Tonight or only Current Tonight.
		//
		// If fullDay is false, then we only have Tonight for the current day's forecast - meaning we have
		// lost a min or max temp value for the day. Therefore, we will see if we were able to cache the the 
		// Today forecast for the current day. If we have, we will use them. If we do not have the cached values,
		// it means that MM or the Computer has been restarted since the time EC rolled off Today from the
		// forecast. In this scenario, we will simply default to the Current Conditions temperature and then
		// check the Tonight temperature.
		//

		if (fullDay == false) {
			if (this.todayCached == true) {
			 weather.minTemperature = this.todayTempCacheMin;
			 weather.maxTemperature = this.todayTempCacheMax;
			} else {
			 weather.minTemperature =  this.convertTemp(jsonObj.siteData.currentConditions.temperature["__text"]);
			 weather.maxTemperature = weather.minTemperature;	
			}			
		}

		//
		// We will check to see if the current Element's temperature is Low or High and set weather values
		// accordingly. We will also check the condition where fullDay is true *and* we are looking at forecast
		// element 0. This is a special case where we will cache temperature values so that we have them later
		// in the current day when the Current Today element rolls off and we have Current Tonight only.
		//

		if (todayClass === "low") {
			weather.minTemperature = this.convertTemp(todayTemp);
			if(today === 0 && fullDay == true) {
				this.todayTempCacheMin = weather.minTemperature;
			}
		}

		if (todayClass === "high") {
			weather.maxTemperature = this.convertTemp(todayTemp);
			if(today === 0 && fullDay == true) {
				this.todayTempCacheMax = weather.maxTemperature;
			}
		}

		if (fullDay == true) {
			var tonightClass = jsonObj.siteData.forecastGroup.forecast[today+1].temperatures.temperature["_class"];
			var tonightTemp = jsonObj.siteData.forecastGroup.forecast[today+1].temperatures.temperature["__text"];

			if (tonightClass === "low") {
				weather.minTemperature = this.convertTemp(tonightTemp);
			}

			if (tonightClass === "high") {
				weather.maxTemperature = this.convertTemp(tonightTemp);
			}
		}

		return;
	},


	//
	// Check for a Precipitation forecast. If there is one, set the precip unit of measure to the Today
	// element units, and accumulate the precip amount. If we are looking a full day (aka Today element plus Tonight
	// element, accumulate the Tonight precip amount as well. Where units are concerned, we assume that they will
	// be the same for Today and Tonight. Note that we are setting units to whatever the EC forecast provides so
	// that we have an accurate measure (i.e. cm or mm) and we can show an accurate forecast each day. That is, it
	// could be possible to Xcm of snow one day and Ymm of rain the next, so a blanket units for precip. would
	// not work well.
	//

	setPrecipitation(weather, jsonObj, today, fullDay) {

		var precipAmt = 0.0;
		var precipUnits = "";

		if (jsonObj.siteData.forecastGroup.forecast[today].precipitation.textSummary != "") {
			precipUnits = jsonObj.siteData.forecastGroup.forecast[today].precipitation.accumulation.amount["_units"];

			precipAmt += jsonObj.siteData.forecastGroup.forecast[today].precipitation.accumulation.amount["__text"] * 1.00;

		}

		if (fullDay == true) {
			if (jsonObj.siteData.forecastGroup.forecast[today+1].precipitation.textSummary != "") {
				precipUnits = jsonObj.siteData.forecastGroup.forecast[today+1].precipitation.accumulation.amount["_units"];

				precipAmt += jsonObj.siteData.forecastGroup.forecast[today+1].precipitation.accumulation.amount["__text"] * 1.00;
			}
		}

		weather.precipitation = this.convertPrecipAmt(precipAmt, precipUnits);
		weather.precipitationUnits = this.convertPrecipUnits(precipUnits);

		return;
	},

	//
	// Unit conversions
	//
	//
	// Convert C to F temps
	//
	convertTemp(temp) {
		if (this.config.tempUnits === "imperial") {
			return 1.8 * temp + 32;
		} else {
			return temp;
		}
	},
	//
	// Convert km/h to mph
	//
	convertWind(kilo) {
		if (this.config.windUnits === "imperial") {
			return kilo / 1.609344;
		} else {
			return kilo;
		}
	},
	//
	// Convert cm or mm to inches
	//
	convertPrecipAmt(amt, units) {
		if (this.config.units === "imperial") {
			if(units === "cm") {			
				return (amt * 0.394);
			}
			if(units === "mm") {			
				return (amt * 0.0394);
			}
		} else {
			return amt;
		}
	},

	//
	// Convert ensure precip units accurately reflect configured units
	//
	convertPrecipUnits(units) {
		if (this.config.units === "imperial") {
			return null;
		} else {
			return " " + units;
		}
	},

	//
	// Convert the icons to a more usable name.
	//
	convertWeatherType(weatherType) {
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
