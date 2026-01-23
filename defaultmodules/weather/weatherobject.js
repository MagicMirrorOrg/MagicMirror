/* global SunCalc, WeatherUtils */

/**
 * @external Moment
 */
class WeatherObject {

	/**
	 * Constructor for a WeatherObject
	 */
	constructor () {
		this.date = null;
		this.windSpeed = null;
		this.windFromDirection = null;
		this.sunrise = null;
		this.sunset = null;
		this.temperature = null;
		this.minTemperature = null;
		this.maxTemperature = null;
		this.weatherType = null;
		this.humidity = null;
		this.precipitationAmount = null;
		this.precipitationUnits = null;
		this.precipitationProbability = null;
		this.feelsLikeTemp = null;
	}

	cardinalWindDirection () {
		if (this.windFromDirection > 11.25 && this.windFromDirection <= 33.75) {
			return "NNE";
		} else if (this.windFromDirection > 33.75 && this.windFromDirection <= 56.25) {
			return "NE";
		} else if (this.windFromDirection > 56.25 && this.windFromDirection <= 78.75) {
			return "ENE";
		} else if (this.windFromDirection > 78.75 && this.windFromDirection <= 101.25) {
			return "E";
		} else if (this.windFromDirection > 101.25 && this.windFromDirection <= 123.75) {
			return "ESE";
		} else if (this.windFromDirection > 123.75 && this.windFromDirection <= 146.25) {
			return "SE";
		} else if (this.windFromDirection > 146.25 && this.windFromDirection <= 168.75) {
			return "SSE";
		} else if (this.windFromDirection > 168.75 && this.windFromDirection <= 191.25) {
			return "S";
		} else if (this.windFromDirection > 191.25 && this.windFromDirection <= 213.75) {
			return "SSW";
		} else if (this.windFromDirection > 213.75 && this.windFromDirection <= 236.25) {
			return "SW";
		} else if (this.windFromDirection > 236.25 && this.windFromDirection <= 258.75) {
			return "WSW";
		} else if (this.windFromDirection > 258.75 && this.windFromDirection <= 281.25) {
			return "W";
		} else if (this.windFromDirection > 281.25 && this.windFromDirection <= 303.75) {
			return "WNW";
		} else if (this.windFromDirection > 303.75 && this.windFromDirection <= 326.25) {
			return "NW";
		} else if (this.windFromDirection > 326.25 && this.windFromDirection <= 348.75) {
			return "NNW";
		} else {
			return "N";
		}
	}

	/**
	 * Determines if the sun sets or rises next. Uses the current time and not
	 * the date from the weather-forecast.
	 * @param {Moment} date an optional date where you want to get the next
	 * action for. Useful only in tests, defaults to the current time.
	 * @returns {string} "sunset" or "sunrise"
	 */
	nextSunAction (date = moment()) {
		return date.isBetween(this.sunrise, this.sunset) ? "sunset" : "sunrise";
	}

	feelsLike () {
		if (this.feelsLikeTemp) {
			return this.feelsLikeTemp;
		}
		return WeatherUtils.calculateFeelsLike(this.temperature, this.windSpeed, this.humidity);
	}

	/**
	 * Checks if the weatherObject is at dayTime.
	 * @returns {boolean} true if it is at dayTime
	 */
	isDayTime () {
		const now = !this.date ? moment() : this.date;
		return now.isBetween(this.sunrise, this.sunset, undefined, "[]");
	}

	/**
	 * Update the sunrise / sunset time depending on the location. This can be
	 * used if your provider doesn't provide that data by itself. Then SunCalc
	 * is used here to calculate them according to the location.
	 * @param {number} lat latitude
	 * @param {number} lon longitude
	 */
	updateSunTime (lat, lon) {
		const now = !this.date ? new Date() : this.date.toDate();
		const times = SunCalc.getTimes(now, lat, lon);
		this.sunrise = moment(times.sunrise);
		this.sunset = moment(times.sunset);
	}

	/**
	 * Clone to simple object to prevent mutating and deprecation of legacy library.
	 *
	 * Before being handed to other modules, mutable values must be cloned safely.
	 * Especially 'moment' object is not immutable, so original 'date', 'sunrise', 'sunset' could be corrupted or changed by other modules.
	 * @returns {object} plained object clone of original weatherObject
	 */
	simpleClone () {
		const toFlat = ["date", "sunrise", "sunset"];
		let clone = { ...this };
		for (const prop of toFlat) {
			clone[prop] = clone?.[prop]?.valueOf() ?? clone?.[prop];
		}
		return clone;
	}
}

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = WeatherObject;
}
