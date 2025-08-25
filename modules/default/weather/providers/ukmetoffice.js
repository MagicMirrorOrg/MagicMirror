/* global WeatherProvider, WeatherObject, WeatherUtils */

/*
 * This class is a provider for UK Met Office Datapoint,
 * see https://www.metoffice.gov.uk/
 */
WeatherProvider.register("ukmetoffice", {

	/*
	 * Set the name of the provider.
	 * This isn't strictly necessary, since it will fallback to the provider identifier
	 * But for debugging (and future alerts) it would be nice to have the real name.
	 */
	providerName: "UK Met Office",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiBase: "http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/",
		locationID: false,
		apiKey: ""
	},

	// Overwrite the fetchCurrentWeather method.
	fetchCurrentWeather () {
		this.fetchData(this.getUrl("3hourly"))
			.then((data) => {
				if (!data || !data.SiteRep || !data.SiteRep.DV || !data.SiteRep.DV.Location || !data.SiteRep.DV.Location.Period || data.SiteRep.DV.Location.Period.length === 0) {

					/*
					 * Did not receive usable new data.
					 * Maybe this needs a better check?
					 */
					return;
				}

				this.setFetchedLocation(`${data.SiteRep.DV.Location.name}, ${data.SiteRep.DV.Location.country}`);

				const currentWeather = this.generateWeatherObjectFromCurrentWeather(data);
				this.setCurrentWeather(currentWeather);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	// Overwrite the fetchCurrentWeather method.
	fetchWeatherForecast () {
		this.fetchData(this.getUrl("daily"))
			.then((data) => {
				if (!data || !data.SiteRep || !data.SiteRep.DV || !data.SiteRep.DV.Location || !data.SiteRep.DV.Location.Period || data.SiteRep.DV.Location.Period.length === 0) {

					/*
					 * Did not receive usable new data.
					 * Maybe this needs a better check?
					 */
					return;
				}

				this.setFetchedLocation(`${data.SiteRep.DV.Location.name}, ${data.SiteRep.DV.Location.country}`);

				const forecast = this.generateWeatherObjectsFromForecast(data);
				this.setWeatherForecast(forecast);
			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	/** UK Met Office Specific Methods - These are not part of the default provider methods */
	/*
	 * Gets the complete url for the request
	 */
	getUrl (forecastType) {
		return this.config.apiBase + this.config.locationID + this.getParams(forecastType);
	},

	/*
	 * Generate a WeatherObject based on currentWeatherInformation
	 */
	generateWeatherObjectFromCurrentWeather (currentWeatherData) {
		const currentWeather = new WeatherObject();
		const location = currentWeatherData.SiteRep.DV.Location;

		// data times are always UTC
		let nowUtc = moment.utc();
		let midnightUtc = nowUtc.clone().startOf("day");
		let timeInMins = nowUtc.diff(midnightUtc, "minutes");

		// loop round each of the (5) periods, look for today (the first period may be yesterday)
		for (const period of location.Period) {
			const periodDate = moment.utc(period.value.substr(0, 10), "YYYY-MM-DD");

			// ignore if period is before today
			if (periodDate.isSameOrAfter(moment.utc().startOf("day"))) {
				// check this is the period we want, after today the diff will be -ve
				if (moment().diff(periodDate, "minutes") > 0) {

					/*
					 * loop round the reports looking for the one we are in
					 * $ value specifies the time in minutes-of-the-day: 0, 180, 360,...1260
					 */
					for (const rep of period.Rep) {
						const p = rep.$;
						if (timeInMins >= p && timeInMins - 180 < p) {
							// finally got the one we want, so populate weather object
							currentWeather.humidity = rep.H;
							currentWeather.temperature = rep.T;
							currentWeather.feelsLikeTemp = rep.F;
							currentWeather.precipitationProbability = parseInt(rep.Pp);
							currentWeather.windSpeed = WeatherUtils.convertWindToMetric(rep.S);
							currentWeather.windFromDirection = WeatherUtils.convertWindDirection(rep.D);
							currentWeather.weatherType = this.convertWeatherType(rep.W);
						}
					}
				}
			}
		}

		// determine the sunrise/sunset times - not supplied in UK Met Office data
		currentWeather.updateSunTime(location.lat, location.lon);

		return currentWeather;
	},

	/*
	 * Generate WeatherObjects based on forecast information
	 */
	generateWeatherObjectsFromForecast (forecasts) {
		const days = [];

		/*
		 * loop round the (5) periods getting the data
		 * for each period array, Day is [0], Night is [1]
		 */
		for (const period of forecasts.SiteRep.DV.Location.Period) {
			const weather = new WeatherObject();

			// data times are always UTC
			const dateStr = period.value;
			let periodDate = moment.utc(dateStr.substr(0, 10), "YYYY-MM-DD");

			// ignore if period is before today
			if (periodDate.isSameOrAfter(moment.utc().startOf("day"))) {
				// populate the weather object
				weather.date = moment.utc(dateStr.substr(0, 10), "YYYY-MM-DD");
				weather.minTemperature = period.Rep[1].Nm;
				weather.maxTemperature = period.Rep[0].Dm;
				weather.weatherType = this.convertWeatherType(period.Rep[0].W);
				weather.precipitationProbability = parseInt(period.Rep[0].PPd);

				days.push(weather);
			}
		}

		return days;
	},

	/*
	 * Convert the Met Office icons to a more usable name.
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

		return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
	},

	/**
	 * Generates an url with api parameters based on the config.
	 * @param {string} forecastType daily or 3hourly forecast
	 * @returns {string} url
	 */
	getParams (forecastType) {
		let params = "?";
		params += `res=${forecastType}`;
		params += `&key=${this.config.apiKey}`;
		return params;
	}
});
