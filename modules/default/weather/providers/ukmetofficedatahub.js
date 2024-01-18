/* global WeatherProvider, WeatherObject */

WeatherProvider.register("ukmetofficedatahub", {
	// Set the name of the provider.
	providerName: "UK Met Office (DataHub)",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiBase: "https://api-metoffice.apiconnect.ibmcloud.com/metoffice/production/v0/forecasts/point/",
		apiKey: "",
		apiSecret: "",
		lat: 0,
		lon: 0
	},

	// Build URL with query strings according to DataHub API (https://metoffice.apiconnect.ibmcloud.com/metoffice/production/api)
	getUrl (forecastType) {
		let queryStrings = "?";
		queryStrings += `latitude=${this.config.lat}`;
		queryStrings += `&longitude=${this.config.lon}`;
		queryStrings += `&includeLocationName=${true}`;

		// Return URL, making sure there is a trailing "/" in the base URL.
		return this.config.apiBase + (this.config.apiBase.endsWith("/") ? "" : "/") + forecastType + queryStrings;
	},

	// Build the list of headers for the request
	// For DataHub requests, the API key/secret are sent in the headers rather than as query strings.
	// Headers defined according to Data Hub API (https://metoffice.apiconnect.ibmcloud.com/metoffice/production/api)
	getHeaders () {
		return {
			accept: "application/json",
			"x-ibm-client-id": this.config.apiKey,
			"x-ibm-client-secret": this.config.apiSecret
		};
	},

	// Fetch data using supplied URL and request headers
	async fetchWeather (url, headers) {
		const response = await fetch(url, { headers: headers });

		// Return JSON data
		return response.json();
	},

	// Fetch hourly forecast data (to use for current weather)
	fetchCurrentWeather () {
		this.fetchWeather(this.getUrl("hourly"), this.getHeaders())
			.then((data) => {
				// Check data is usable
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
			.catch((error) => Log.error(`Could not load data: ${error.message}`))

			// Let the module know there is data available
			.finally(() => this.updateAvailable());
	},

	// Create a WeatherObject using current weather data (data for the current hour)
	generateWeatherObjectFromCurrentWeather (currentWeatherData) {
		const currentWeather = new WeatherObject();

		// Extract the actual forecasts
		let forecastDataHours = currentWeatherData.features[0].properties.timeSeries;

		// Define now
		let nowUtc = moment.utc();

		// Find hour that contains the current time
		for (let hour in forecastDataHours) {
			let forecastTime = moment.utc(forecastDataHours[hour].time);
			if (nowUtc.isSameOrAfter(forecastTime) && nowUtc.isBefore(moment(forecastTime.add(1, "h")))) {
				currentWeather.date = forecastTime;
				currentWeather.windSpeed = forecastDataHours[hour].windSpeed10m;
				currentWeather.windFromDirection = forecastDataHours[hour].windDirectionFrom10m;
				currentWeather.temperature = forecastDataHours[hour].screenTemperature;
				currentWeather.minTemperature = forecastDataHours[hour].minScreenAirTemp;
				currentWeather.maxTemperature = forecastDataHours[hour].maxScreenAirTemp;
				currentWeather.weatherType = this.convertWeatherType(forecastDataHours[hour].significantWeatherCode);
				currentWeather.humidity = forecastDataHours[hour].screenRelativeHumidity;
				currentWeather.rain = forecastDataHours[hour].totalPrecipAmount;
				currentWeather.snow = forecastDataHours[hour].totalSnowAmount;
				currentWeather.precipitationProbability = forecastDataHours[hour].probOfPrecipitation;
				currentWeather.feelsLikeTemp = forecastDataHours[hour].feelsLikeTemperature;

				// Pass on full details, so they can be used in custom templates
				// Note the units of the supplied data when using this (see top of file)
				currentWeather.rawData = forecastDataHours[hour];
			}
		}

		// Determine the sunrise/sunset times - (still) not supplied in UK Met Office data
		// Passes {longitude, latitude} to SunCalc, could pass height to, but
		// SunCalc.getTimes doesn't take that into account
		currentWeather.updateSunTime(this.config.lat, this.config.lon);

		return currentWeather;
	},

	// Fetch daily forecast data
	fetchWeatherForecast () {
		this.fetchWeather(this.getUrl("daily"), this.getHeaders())
			.then((data) => {
				// Check data is usable
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
			.catch((error) => Log.error(`Could not load data: ${error.message}`))

			// Let the module know there is new data available
			.finally(() => this.updateAvailable());
	},

	// Create a WeatherObject for each day using daily forecast data
	generateWeatherObjectsFromForecast (forecasts) {
		const dailyForecasts = [];

		// Extract the actual forecasts
		let forecastDataDays = forecasts.features[0].properties.timeSeries;

		// Define today
		let today = moment.utc().startOf("date");

		// Go through each day in the forecasts
		for (let day in forecastDataDays) {
			const forecastWeather = new WeatherObject();

			// Get date of forecast
			let forecastDate = moment.utc(forecastDataDays[day].time);

			// Check if forecast is for today or in the future (i.e., ignore yesterday's forecast)
			if (forecastDate.isSameOrAfter(today)) {
				forecastWeather.date = forecastDate;
				forecastWeather.minTemperature = forecastDataDays[day].nightMinScreenTemperature;
				forecastWeather.maxTemperature = forecastDataDays[day].dayMaxScreenTemperature;

				// Using daytime forecast values
				forecastWeather.windSpeed = forecastDataDays[day].midday10MWindSpeed;
				forecastWeather.windFromDirection = forecastDataDays[day].midday10MWindDirection;
				forecastWeather.weatherType = this.convertWeatherType(forecastDataDays[day].daySignificantWeatherCode);
				forecastWeather.precipitationProbability = forecastDataDays[day].dayProbabilityOfPrecipitation;
				forecastWeather.temperature = forecastDataDays[day].dayMaxScreenTemperature;
				forecastWeather.humidity = forecastDataDays[day].middayRelativeHumidity;
				forecastWeather.rain = forecastDataDays[day].dayProbabilityOfRain;
				forecastWeather.snow = forecastDataDays[day].dayProbabilityOfSnow;
				forecastWeather.feelsLikeTemp = forecastDataDays[day].dayMaxFeelsLikeTemp;

				// Pass on full details, so they can be used in custom templates
				// Note the units of the supplied data when using this (see top of file)
				forecastWeather.rawData = forecastDataDays[day];

				dailyForecasts.push(forecastWeather);
			}
		}

		return dailyForecasts;
	},

	// Set the fetched location name.
	setFetchedLocation (name) {
		this.fetchedLocationName = name;
	},

	// Match the Met Office "significant weather code" to a weathericons.css icon
	// Use: https://metoffice.apiconnect.ibmcloud.com/metoffice/production/node/264
	// and: https://erikflowers.github.io/weather-icons/
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

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	}
});
