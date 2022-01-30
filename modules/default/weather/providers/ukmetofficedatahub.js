/* global WeatherProvider, WeatherObject */

/* MagicMirror²
 * Module: Weather
 *
 * By Malcolm Oakes https://github.com/maloakes
 * Existing Met Office provider edited for new MetOffice Data Hub by CreepinJesus http://github.com/XBCreepinJesus
 * MIT Licensed.
 *
 * This class is a provider for UK Met Office Data Hub (the replacement for their Data Point services).
 * For more information on Data Hub, see https://www.metoffice.gov.uk/services/data/datapoint/notifications/weather-datahub
 * Data available:
 * 		Hourly data for next 2 days ("hourly") - https://www.metoffice.gov.uk/binaries/content/assets/metofficegovuk/pdf/data/global-spot-data-hourly.pdf
 * 		3-hourly data for the next 7 days ("3hourly") - https://www.metoffice.gov.uk/binaries/content/assets/metofficegovuk/pdf/data/global-spot-data-3-hourly.pdf
 * 		Daily data for the next 7 days ("daily") - https://www.metoffice.gov.uk/binaries/content/assets/metofficegovuk/pdf/data/global-spot-data-daily.pdf
 *
 * NOTES
 * This provider requires longitude/latitude coordinates, rather than a location ID (as with the previous Met Office provider)
 * Provide the following in your config.js file:
 * 		weatherProvider: "ukmetofficedatahub",
 * 		apiBase: "https://api-metoffice.apiconnect.ibmcloud.com/metoffice/production/v0/forecasts/point/",
 * 		apiKey: "[YOUR API KEY]",
 * 		apiSecret: "[YOUR API SECRET]]",
 * 		lat: [LATITUDE (DECIMAL)],
 * 		lon: [LONGITUDE (DECIMAL)],
 *		windUnits: "mps" | "kph" | "mph" (default)
 *		tempUnits: "imperial" | "metric" (default)
 *
 * At time of writing, free accounts are limited to 360 requests a day per service (hourly, 3hourly, daily); take this in mind when
 * setting your update intervals. For reference, 360 requests per day is once every 4 minutes.
 *
 * Pay attention to the units of the supplied data from the Met Office - it is given in SI/metric units where applicable:
 * 	- Temperatures are in degrees Celsius (°C)
 * 	- Wind speeds are in metres per second (m/s)
 * 	- Wind direction given in degrees (°)
 * 	- Pressures are in Pascals (Pa)
 * 	- Distances are in metres (m)
 * 	- Probabilities and humidity are given as percentages (%)
 * 	- Precipitation is measured in millimetres (mm) with rates per hour (mm/h)
 *
 * See the PDFs linked above for more information on the data their corresponding units.
 */

WeatherProvider.register("ukmetofficedatahub", {
	// Set the name of the provider.
	providerName: "UK Met Office (DataHub)",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiBase: "https://api-metoffice.apiconnect.ibmcloud.com/metoffice/production/v0/forecasts/point/",
		apiKey: "",
		apiSecret: "",
		lat: 0,
		lon: 0,
		windUnits: "mph"
	},

	// Build URL with query strings according to DataHub API (https://metoffice.apiconnect.ibmcloud.com/metoffice/production/api)
	getUrl(forecastType) {
		let queryStrings = "?";
		queryStrings += "latitude=" + this.config.lat;
		queryStrings += "&longitude=" + this.config.lon;
		queryStrings += "&includeLocationName=" + true;

		// Return URL, making sure there is a trailing "/" in the base URL.
		return this.config.apiBase + (this.config.apiBase.endsWith("/") ? "" : "/") + forecastType + queryStrings;
	},

	// Build the list of headers for the request
	// For DataHub requests, the API key/secret are sent in the headers rather than as query strings.
	// Headers defined according to Data Hub API (https://metoffice.apiconnect.ibmcloud.com/metoffice/production/api)
	getHeaders() {
		return {
			accept: "application/json",
			"x-ibm-client-id": this.config.apiKey,
			"x-ibm-client-secret": this.config.apiSecret
		};
	},

	// Fetch data using supplied URL and request headers
	async fetchWeather(url, headers) {
		const response = await fetch(url, { headers: headers });

		// Return JSON data
		return response.json();
	},

	// Fetch hourly forecast data (to use for current weather)
	fetchCurrentWeather() {
		this.fetchWeather(this.getUrl("hourly"), this.getHeaders())
			.then((data) => {
				// Check data is useable
				if (!data || !data.features || !data.features[0].properties || !data.features[0].properties.timeSeries || data.features[0].properties.timeSeries.length === 0) {
					// Did not receive usable new data.
					// Maybe this needs a better check?
					Log.error("Possibly bad current/hourly data?");
					Log.error(data);
					return;
				}

				// Set location name
				this.setFetchedLocation(`${data.features[0].properties.location.name}`);

				// Generate current weather data
				const currentWeather = this.generateWeatherObjectFromCurrentWeather(data);
				this.setCurrentWeather(currentWeather);
			})

			// Catch any error(s)
			.catch((error) => Log.error("Could not load data: " + error.message))

			// Let the module know there're new data available
			.finally(() => this.updateAvailable());
	},

	// Create a WeatherObject using current weather data (data for the current hour)
	generateWeatherObjectFromCurrentWeather(currentWeatherData) {
		const currentWeather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);

		// Extract the actual forecasts
		let forecastDataHours = currentWeatherData.features[0].properties.timeSeries;

		// Define now
		let nowUtc = moment.utc();

		// Find hour that contains the current time
		for (let hour in forecastDataHours) {
			let forecastTime = moment.utc(forecastDataHours[hour].time);
			if (nowUtc.isSameOrAfter(forecastTime) && nowUtc.isBefore(moment(forecastTime.add(1, "h")))) {
				currentWeather.date = forecastTime;
				currentWeather.windSpeed = this.convertWindSpeed(forecastDataHours[hour].windSpeed10m);
				currentWeather.windDirection = forecastDataHours[hour].windDirectionFrom10m;
				currentWeather.temperature = this.convertTemp(forecastDataHours[hour].screenTemperature);
				currentWeather.minTemperature = this.convertTemp(forecastDataHours[hour].minScreenAirTemp);
				currentWeather.maxTemperature = this.convertTemp(forecastDataHours[hour].maxScreenAirTemp);
				currentWeather.weatherType = this.convertWeatherType(forecastDataHours[hour].significantWeatherCode);
				currentWeather.humidity = forecastDataHours[hour].screenRelativeHumidity;
				currentWeather.rain = forecastDataHours[hour].totalPrecipAmount;
				currentWeather.snow = forecastDataHours[hour].totalSnowAmount;
				currentWeather.precipitation = forecastDataHours[hour].probOfPrecipitation;
				currentWeather.feelsLikeTemp = this.convertTemp(forecastDataHours[hour].feelsLikeTemperature);

				// Pass on full details so they can be used in custom templates
				// Note the units of the supplied data when using this (see top of file)
				currentWeather.rawData = forecastDataHours[hour];
			}
		}

		// Determine the sunrise/sunset times - (still) not supplied in UK Met Office data
		// Passes {longitude, latitude} to SunCalc, could pass height to, but
		// SunCalc.getTimes doesnt take that into account
		currentWeather.updateSunTime(this.config.lat, this.config.lon);

		return currentWeather;
	},

	// Fetch daily forecast data
	fetchWeatherForecast() {
		this.fetchWeather(this.getUrl("daily"), this.getHeaders())
			.then((data) => {
				// Check data is useable
				if (!data || !data.features || !data.features[0].properties || !data.features[0].properties.timeSeries || data.features[0].properties.timeSeries.length === 0) {
					// Did not receive usable new data.
					// Maybe this needs a better check?
					Log.error("Possibly bad forecast data?");
					Log.error(data);
					return;
				}

				// Set location name
				this.setFetchedLocation(`${data.features[0].properties.location.name}`);

				// Generate the forecast data
				const forecast = this.generateWeatherObjectsFromForecast(data);
				this.setWeatherForecast(forecast);
			})

			// Catch any error(s)
			.catch((error) => Log.error("Could not load data: " + error.message))

			// Let the module know there're new data available
			.finally(() => this.updateAvailable());
	},

	// Create a WeatherObject for each day using daily forecast data
	generateWeatherObjectsFromForecast(forecasts) {
		const dailyForecasts = [];

		// Extract the actual forecasts
		let forecastDataDays = forecasts.features[0].properties.timeSeries;

		// Define today
		let today = moment.utc().startOf("date");

		// Go through each day in the forecasts
		for (let day in forecastDataDays) {
			const forecastWeather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);

			// Get date of forecast
			let forecastDate = moment.utc(forecastDataDays[day].time);

			// Check if forecast is for today or in the future (i.e., ignore yesterday's forecast)
			if (forecastDate.isSameOrAfter(today)) {
				forecastWeather.date = forecastDate;
				forecastWeather.minTemperature = this.convertTemp(forecastDataDays[day].nightMinScreenTemperature);
				forecastWeather.maxTemperature = this.convertTemp(forecastDataDays[day].dayMaxScreenTemperature);

				// Using daytime forecast values
				forecastWeather.windSpeed = this.convertWindSpeed(forecastDataDays[day].midday10MWindSpeed);
				forecastWeather.windDirection = forecastDataDays[day].midday10MWindDirection;
				forecastWeather.weatherType = this.convertWeatherType(forecastDataDays[day].daySignificantWeatherCode);
				forecastWeather.precipitation = forecastDataDays[day].dayProbabilityOfPrecipitation;
				forecastWeather.temperature = forecastDataDays[day].dayMaxScreenTemperature;
				forecastWeather.humidity = forecastDataDays[day].middayRelativeHumidity;
				forecastWeather.rain = forecastDataDays[day].dayProbabilityOfRain;
				forecastWeather.snow = forecastDataDays[day].dayProbabilityOfSnow;
				forecastWeather.feelsLikeTemp = this.convertTemp(forecastDataDays[day].dayMaxFeelsLikeTemp);

				// Pass on full details so they can be used in custom templates
				// Note the units of the supplied data when using this (see top of file)
				forecastWeather.rawData = forecastDataDays[day];

				dailyForecasts.push(forecastWeather);
			}
		}

		return dailyForecasts;
	},

	// Set the fetched location name.
	setFetchedLocation: function (name) {
		this.fetchedLocationName = name;
	},

	// Convert temperatures to Fahrenheit (from degrees C), if required
	convertTemp(tempInC) {
		return this.config.tempUnits === "imperial" ? (tempInC * 9) / 5 + 32 : tempInC;
	},

	// Convert wind speed from metres per second
	// To keep the supplied metres per second units, use "mps"
	// To use kilometres per hour, use "kph"
	// Else assumed imperial and the value is returned in miles per hour (a Met Office user is likely to be UK-based)
	convertWindSpeed(windInMpS) {
		if (this.config.windUnits === "mps") {
			return windInMpS;
		}

		if (this.config.windUnits === "kph" || this.config.windUnits === "metric" || this.config.useKmh) {
			return windInMpS * 3.6;
		}

		return windInMpS * 2.23694;
	},

	// Match the Met Office "significant weather code" to a weathericons.css icon
	// Use: https://metoffice.apiconnect.ibmcloud.com/metoffice/production/node/264
	// and: https://erikflowers.github.io/weather-icons/
	convertWeatherType(weatherType) {
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

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	}
});
