/* global WeatherProvider, WeatherObject, SunCalc */

/* Magic Mirror
 * Module: Weather
 *
 * By Malcolm Oakes https://github.com/maloakes
 * MIT Licensed.
 *
 * This class is a provider for UK Met Office Datapoint.
 */
WeatherProvider.register("ukmetoffice", {
	// Set the name of the provider.
	// This isn't strictly necessary, since it will fallback to the provider identifier
	// But for debugging (and future alerts) it would be nice to have the real name.
	providerName: "UK Met Office",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiBase: "http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/",
		locationID: false,
		apiKey: ""
	},

	units: {
		imperial: "us",
		metric: "si"
	},

	// Overwrite the fetchCurrentWeather method.
	fetchCurrentWeather() {
		this.fetchData(this.getUrl("3hourly"))
			.then((data) => {
				if (!data || !data.SiteRep || !data.SiteRep.DV || !data.SiteRep.DV.Location || !data.SiteRep.DV.Location.Period || data.SiteRep.DV.Location.Period.length === 0) {
					// Did not receive usable new data.
					// Maybe this needs a better check?
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
	fetchWeatherForecast() {
		this.fetchData(this.getUrl("daily"))
			.then((data) => {
				if (!data || !data.SiteRep || !data.SiteRep.DV || !data.SiteRep.DV.Location || !data.SiteRep.DV.Location.Period || data.SiteRep.DV.Location.Period.length === 0) {
					// Did not receive usable new data.
					// Maybe this needs a better check?
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
	getUrl(forecastType) {
		return this.config.apiBase + this.config.locationID + this.getParams(forecastType);
	},

	/*
	 * Generate a WeatherObject based on currentWeatherInformation
	 */
	generateWeatherObjectFromCurrentWeather(currentWeatherData) {
		const currentWeather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);

		// data times are always UTC
		let nowUtc = moment.utc();
		let midnightUtc = nowUtc.clone().startOf("day");
		let timeInMins = nowUtc.diff(midnightUtc, "minutes");

		// loop round each of the (5) periods, look for today (the first period may be yesterday)
		for (var i in currentWeatherData.SiteRep.DV.Location.Period) {
			let periodDate = moment.utc(currentWeatherData.SiteRep.DV.Location.Period[i].value.substr(0, 10), "YYYY-MM-DD");

			// ignore if period is before today
			if (periodDate.isSameOrAfter(moment.utc().startOf("day"))) {
				// check this is the period we want, after today the diff will be -ve
				if (moment().diff(periodDate, "minutes") > 0) {
					// loop round the reports looking for the one we are in
					// $ value specifies the time in minutes-of-the-day: 0, 180, 360,...1260
					for (var j in currentWeatherData.SiteRep.DV.Location.Period[i].Rep) {
						let p = currentWeatherData.SiteRep.DV.Location.Period[i].Rep[j].$;
						if (timeInMins >= p && timeInMins - 180 < p) {
							// finally got the one we want, so populate weather object
							currentWeather.humidity = currentWeatherData.SiteRep.DV.Location.Period[i].Rep[j].H;
							currentWeather.temperature = this.convertTemp(currentWeatherData.SiteRep.DV.Location.Period[i].Rep[j].T);
							currentWeather.feelsLikeTemp = this.convertTemp(currentWeatherData.SiteRep.DV.Location.Period[i].Rep[j].F);
							currentWeather.precipitation = parseInt(currentWeatherData.SiteRep.DV.Location.Period[i].Rep[j].Pp);
							currentWeather.windSpeed = this.convertWindSpeed(currentWeatherData.SiteRep.DV.Location.Period[i].Rep[j].S);
							currentWeather.windDirection = this.convertWindDirection(currentWeatherData.SiteRep.DV.Location.Period[i].Rep[j].D);
							currentWeather.weatherType = this.convertWeatherType(currentWeatherData.SiteRep.DV.Location.Period[i].Rep[j].W);
						}
					}
				}
			}
		}

		// determine the sunrise/sunset times - not supplied in UK Met Office data
		let times = this.calcAstroData(currentWeatherData.SiteRep.DV.Location);
		currentWeather.sunrise = times[0];
		currentWeather.sunset = times[1];

		return currentWeather;
	},

	/*
	 * Generate WeatherObjects based on forecast information
	 */
	generateWeatherObjectsFromForecast(forecasts) {
		const days = [];

		// loop round the (5) periods getting the data
		// for each period array, Day is [0], Night is [1]
		for (var j in forecasts.SiteRep.DV.Location.Period) {
			const weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);

			// data times are always UTC
			const dateStr = forecasts.SiteRep.DV.Location.Period[j].value;
			let periodDate = moment.utc(dateStr.substr(0, 10), "YYYY-MM-DD");

			// ignore if period is before today
			if (periodDate.isSameOrAfter(moment.utc().startOf("day"))) {
				// populate the weather object
				weather.date = moment.utc(dateStr.substr(0, 10), "YYYY-MM-DD");
				weather.minTemperature = this.convertTemp(forecasts.SiteRep.DV.Location.Period[j].Rep[1].Nm);
				weather.maxTemperature = this.convertTemp(forecasts.SiteRep.DV.Location.Period[j].Rep[0].Dm);
				weather.weatherType = this.convertWeatherType(forecasts.SiteRep.DV.Location.Period[j].Rep[0].W);
				weather.precipitation = parseInt(forecasts.SiteRep.DV.Location.Period[j].Rep[0].PPd);

				days.push(weather);
			}
		}

		return days;
	},

	/*
	 * calculate the astronomical data
	 */
	calcAstroData(location) {
		const sunTimes = [];

		// determine the sunrise/sunset times
		let times = SunCalc.getTimes(new Date(), location.lat, location.lon);
		sunTimes.push(moment(times.sunrise, "X"));
		sunTimes.push(moment(times.sunset, "X"));

		return sunTimes;
	},

	/*
	 * Convert the Met Office icons to a more usable name.
	 */
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
	},

	/*
	 * Convert temp (from degrees C) if required
	 */
	convertTemp(tempInC) {
		return this.tempUnits === "imperial" ? (tempInC * 9) / 5 + 32 : tempInC;
	},

	/*
	 * Convert wind speed (from mph to m/s or km/h) if required
	 */
	convertWindSpeed(windInMph) {
		return this.windUnits === "metric" ? (this.useKmh ? windInMph * 1.60934 : windInMph / 2.23694) : windInMph;
	},

	/*
	 * Convert the wind direction cardinal to value
	 */
	convertWindDirection(windDirection) {
		const windCardinals = {
			N: 0,
			NNE: 22,
			NE: 45,
			ENE: 67,
			E: 90,
			ESE: 112,
			SE: 135,
			SSE: 157,
			S: 180,
			SSW: 202,
			SW: 225,
			WSW: 247,
			W: 270,
			WNW: 292,
			NW: 315,
			NNW: 337
		};

		return windCardinals.hasOwnProperty(windDirection) ? windCardinals[windDirection] : null;
	},

	/*
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams(forecastType) {
		let params = "?";
		params += "res=" + forecastType;
		params += "&key=" + this.config.apiKey;

		return params;
	}
});
