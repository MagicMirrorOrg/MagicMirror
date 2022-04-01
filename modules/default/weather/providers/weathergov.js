/* global WeatherProvider, WeatherObject */

/* MagicMirror²
 * Module: Weather
 * Provider: weather.gov
 * https://weather-gov.github.io/api/general-faqs
 *
 * Original by Vince Peri
 * MIT Licensed.
 *
 * This class is a provider for weather.gov.
 * Note that this is only for US locations (lat and lon) and does not require an API key
 * Since it is free, there are some items missing - like sunrise, sunset
 */

WeatherProvider.register("weathergov", {
	// Set the name of the provider.
	// This isn't strictly necessary, since it will fallback to the provider identifier
	// But for debugging (and future alerts) it would be nice to have the real name.
	providerName: "Weather.gov",

	// Set the default config properties that is specific to this provider
	defaults: {
		apiBase: "https://api.weather.gov/points/",
		weatherEndpoint: "/forecast",
		lat: 0,
		lon: 0
	},

	// Flag all needed URLs availability
	configURLs: false,

	//This API has multiple urls involved
	forecastURL: "tbd",
	forecastHourlyURL: "tbd",
	forecastGridDataURL: "tbd",
	observationStationsURL: "tbd",
	stationObsURL: "tbd",

	// Called to set the config, this config is the same as the weather module's config.
	setConfig: function (config) {
		this.config = config;
		this.config.apiBase = "https://api.weather.gov";
		this.fetchWxGovURLs(this.config);
	},

	// Called when the weather provider is about to start.
	start: function () {
		Log.info(`Weather provider: ${this.providerName} started.`);
	},

	// This returns the name of the fetched location or an empty string.
	fetchedLocation: function () {
		return this.fetchedLocationName || "";
	},

	// Overwrite the fetchCurrentWeather method.
	fetchCurrentWeather() {
		if (!this.configURLs) {
			Log.info("fetch wx waiting on config URLs");
			return;
		}
		this.fetchData(this.stationObsURL)
			.then((data) => {
				if (!data || !data.properties) {
					// Did not receive usable new data.
					return;
				}
				const currentWeather = this.generateWeatherObjectFromCurrentWeather(data.properties);
				this.setCurrentWeather(currentWeather);
			})
			.catch(function (request) {
				Log.error("Could not load station obs data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	// Overwrite the fetchWeatherForecast method.
	fetchWeatherForecast() {
		if (!this.configURLs) {
			Log.info("fetch wx waiting on config URLs");
			return;
		}
		this.fetchData(this.forecastURL)
			.then((data) => {
				if (!data || !data.properties || !data.properties.periods || !data.properties.periods.length) {
					// Did not receive usable new data.
					return;
				}
				const forecast = this.generateWeatherObjectsFromForecast(data.properties.periods);
				this.setWeatherForecast(forecast);
			})
			.catch(function (request) {
				Log.error("Could not load forecast hourly data ... ", request);
			})
			.finally(() => this.updateAvailable());
	},

	/** Weather.gov Specific Methods - These are not part of the default provider methods */

	/*
	 * Get specific URLs
	 */
	fetchWxGovURLs(config) {
		this.fetchData(`${config.apiBase}/points/${config.lat},${config.lon}`)
			.then((data) => {
				if (!data || !data.properties) {
					// points URL did not respond with usable data.
					return;
				}
				this.fetchedLocationName = data.properties.relativeLocation.properties.city + ", " + data.properties.relativeLocation.properties.state;
				Log.log("Forecast location is " + this.fetchedLocationName);
				this.forecastURL = data.properties.forecast;
				this.forecastHourlyURL = data.properties.forecastHourly;
				this.forecastGridDataURL = data.properties.forecastGridData;
				this.observationStationsURL = data.properties.observationStations;
				// with this URL, we chain another promise for the station obs URL
				return this.fetchData(data.properties.observationStations);
			})
			.then((obsData) => {
				if (!obsData || !obsData.features) {
					// obs station URL did not respond with usable data.
					return;
				}
				this.stationObsURL = obsData.features[0].id + "/observations/latest";
			})
			.catch((err) => {
				Log.error(err);
			})
			.finally(() => {
				// excellent, let's fetch some actual wx data
				this.configURLs = true;
				// handle 'forecast' config, fall back to 'current'
				if (config.type === "forecast") {
					this.fetchWeatherForecast();
				} else {
					this.fetchCurrentWeather();
				}
			});
	},

	/*
	 * Generate a WeatherObject based on currentWeatherInformation
	 * Weather.gov API uses specific units; API does not include choice of units
	 * ... object needs data in units based on config!
	 */
	generateWeatherObjectFromCurrentWeather(currentWeatherData) {
		const currentWeather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);

		currentWeather.date = moment(currentWeatherData.timestamp);
		currentWeather.temperature = this.convertTemp(currentWeatherData.temperature.value);
		currentWeather.windSpeed = this.convertSpeed(currentWeatherData.windSpeed.value);
		currentWeather.windDirection = currentWeatherData.windDirection.value;
		currentWeather.minTemperature = this.convertTemp(currentWeatherData.minTemperatureLast24Hours.value);
		currentWeather.maxTemperature = this.convertTemp(currentWeatherData.maxTemperatureLast24Hours.value);
		currentWeather.humidity = Math.round(currentWeatherData.relativeHumidity.value);
		currentWeather.rain = null;
		currentWeather.snow = null;
		currentWeather.precipitation = this.convertLength(currentWeatherData.precipitationLastHour.value);
		if (currentWeatherData.heatIndex.value !== null) {
			currentWeather.feelsLikeTemp = this.convertTemp(currentWeatherData.heatIndex.value);
		} else if (currentWeatherData.windChill.value !== null) {
			currentWeather.feelsLikeTemp = this.convertTemp(currentWeatherData.windChill.value);
		} else {
			currentWeather.feelsLikeTemp = this.convertTemp(currentWeatherData.temperature.value);
		}
		// determine the sunrise/sunset times - not supplied in weather.gov data
		currentWeather.updateSunTime(this.config.lat, this.config.lon);

		// update weatherType
		currentWeather.weatherType = this.convertWeatherType(currentWeatherData.textDescription, currentWeather.isDayTime());

		return currentWeather;
	},

	/*
	 * Generate WeatherObjects based on forecast information
	 */
	generateWeatherObjectsFromForecast(forecasts) {
		return this.fetchForecastDaily(forecasts);
	},

	/*
	 * fetch forecast information for daily forecast.
	 */
	fetchForecastDaily(forecasts) {
		// initial variable declaration
		const days = [];
		// variables for temperature range and rain
		let minTemp = [];
		let maxTemp = [];
		// variable for date
		let date = "";
		let weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);
		weather.precipitation = 0;

		for (const forecast of forecasts) {
			if (date !== moment(forecast.startTime).format("YYYY-MM-DD")) {
				// calculate minimum/maximum temperature, specify rain amount
				weather.minTemperature = Math.min.apply(null, minTemp);
				weather.maxTemperature = Math.max.apply(null, maxTemp);

				// push weather information to days array
				days.push(weather);
				// create new weather-object
				weather = new WeatherObject(this.config.units, this.config.tempUnits, this.config.windUnits, this.config.useKmh);

				minTemp = [];
				maxTemp = [];
				weather.precipitation = 0;

				// set new date
				date = moment(forecast.startTime).format("YYYY-MM-DD");

				// specify date
				weather.date = moment(forecast.startTime);

				// use the forecast isDayTime attribute to help build the weatherType label
				weather.weatherType = this.convertWeatherType(forecast.shortForecast, forecast.isDaytime);
			}

			if (moment(forecast.startTime).format("H") >= 8 && moment(forecast.startTime).format("H") <= 17) {
				weather.weatherType = this.convertWeatherType(forecast.shortForecast, forecast.isDaytime);
			}

			// the same day as before
			// add values from forecast to corresponding variables
			minTemp.push(forecast.temperature);
			maxTemp.push(forecast.temperature);
		}

		// last day
		// calculate minimum/maximum temperature
		weather.minTemperature = Math.min.apply(null, minTemp);
		weather.maxTemperature = Math.max.apply(null, maxTemp);

		// push weather information to days array
		days.push(weather);
		return days.slice(1);
	},

	/*
	 * Unit conversions
	 */
	// conversion to fahrenheit
	convertTemp(temp) {
		if (this.config.tempUnits === "imperial") {
			return (9 / 5) * temp + 32;
		} else {
			return temp;
		}
	},
	// conversion to mph or kmh
	convertSpeed(metSec) {
		if (this.config.windUnits === "imperial") {
			return metSec * 2.23694;
		} else {
			if (this.config.useKmh) {
				return metSec * 3.6;
			} else {
				return metSec;
			}
		}
	},
	// conversion to inches
	convertLength(meters) {
		if (this.config.units === "imperial") {
			return meters * 39.3701;
		} else {
			return meters;
		}
	},

	/*
	 * Convert the icons to a more usable name.
	 */
	convertWeatherType(weatherType, isDaytime) {
		//https://w1.weather.gov/xml/current_obs/weather.php
		// There are way too many types to create, so lets just look for certain strings

		if (weatherType.includes("Cloudy") || weatherType.includes("Partly")) {
			if (isDaytime) {
				return "day-cloudy";
			}

			return "night-cloudy";
		} else if (weatherType.includes("Overcast")) {
			if (isDaytime) {
				return "cloudy";
			}

			return "night-cloudy";
		} else if (weatherType.includes("Freezing") || weatherType.includes("Ice")) {
			return "rain-mix";
		} else if (weatherType.includes("Snow")) {
			if (isDaytime) {
				return "snow";
			}

			return "night-snow";
		} else if (weatherType.includes("Thunderstorm")) {
			if (isDaytime) {
				return "thunderstorm";
			}

			return "night-thunderstorm";
		} else if (weatherType.includes("Showers")) {
			if (isDaytime) {
				return "showers";
			}

			return "night-showers";
		} else if (weatherType.includes("Rain") || weatherType.includes("Drizzle")) {
			if (isDaytime) {
				return "rain";
			}

			return "night-rain";
		} else if (weatherType.includes("Breezy") || weatherType.includes("Windy")) {
			if (isDaytime) {
				return "cloudy-windy";
			}

			return "night-alt-cloudy-windy";
		} else if (weatherType.includes("Fair") || weatherType.includes("Clear") || weatherType.includes("Few") || weatherType.includes("Sunny")) {
			if (isDaytime) {
				return "day-sunny";
			}

			return "night-clear";
		} else if (weatherType.includes("Dust") || weatherType.includes("Sand")) {
			return "dust";
		} else if (weatherType.includes("Fog")) {
			return "fog";
		} else if (weatherType.includes("Smoke")) {
			return "smoke";
		} else if (weatherType.includes("Haze")) {
			return "day-haze";
		}

		return null;
	},

	/*
	Convert the direction into Degrees
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
	}
});
