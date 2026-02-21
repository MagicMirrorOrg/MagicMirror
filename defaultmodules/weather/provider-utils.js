/**
 * Shared utility functions for weather providers
 */

/**
 * Convert OpenWeatherMap icon codes to internal weather types
 * @param {string} weatherType - OpenWeatherMap icon code (e.g., "01d", "02n")
 * @returns {string|null} Internal weather type
 */
function convertWeatherType (weatherType) {
	const weatherTypes = {
		"01d": "day-sunny",
		"02d": "day-cloudy",
		"03d": "cloudy",
		"04d": "cloudy-windy",
		"09d": "showers",
		"10d": "rain",
		"11d": "thunderstorm",
		"13d": "snow",
		"50d": "fog",
		"01n": "night-clear",
		"02n": "night-cloudy",
		"03n": "night-cloudy",
		"04n": "night-cloudy",
		"09n": "night-showers",
		"10n": "night-rain",
		"11n": "night-thunderstorm",
		"13n": "night-snow",
		"50n": "night-alt-cloudy-windy"
	};

	return weatherTypes.hasOwnProperty(weatherType) ? weatherTypes[weatherType] : null;
}

/**
 * Apply timezone offset to a date
 * @param {Date} date - The date to apply offset to
 * @param {number} offsetMinutes - Timezone offset in minutes
 * @returns {Date} Date with applied offset
 */
function applyTimezoneOffset (date, offsetMinutes) {
	const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
	return new Date(utcTime + (offsetMinutes * 60000));
}

/**
 * Limit decimal places for coordinates (truncate, not round)
 * @param {number} value - The coordinate value
 * @param {number} decimals - Maximum number of decimal places
 * @returns {number} Value with limited decimal places
 */
function limitDecimals (value, decimals) {
	const str = value.toString();
	if (str.includes(".")) {
		const parts = str.split(".");
		if (parts[1].length > decimals) {
			return parseFloat(`${parts[0]}.${parts[1].substring(0, decimals)}`);
		}
	}
	return value;
}

/**
 * Get sunrise and sunset times for a given date and location
 * @param {Date} date - The date to calculate for
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {object} Object with sunrise and sunset Date objects
 */
function getSunTimes (date, lat, lon) {
	const SunCalc = require("suncalc");
	const sunTimes = SunCalc.getTimes(date, lat, lon);
	return {
		sunrise: sunTimes.sunrise,
		sunset: sunTimes.sunset
	};
}

/**
 * Check if a given time is during daylight hours
 * @param {Date} date - The date/time to check
 * @param {Date} sunrise - Sunrise time
 * @param {Date} sunset - Sunset time
 * @returns {boolean} True if during daylight hours
 */
function isDayTime (date, sunrise, sunset) {
	if (!sunrise || !sunset) {
		return true; // Default to day if times unavailable
	}
	return date >= sunrise && date < sunset;
}

/**
 * Format timezone offset as string (e.g., "+01:00", "-05:30")
 * @param {number} offsetMinutes - Timezone offset in minutes (use -new Date().getTimezoneOffset() for local)
 * @returns {string} Formatted offset string
 */
function formatTimezoneOffset (offsetMinutes) {
	const hours = Math.floor(Math.abs(offsetMinutes) / 60);
	const minutes = Math.abs(offsetMinutes) % 60;
	const sign = offsetMinutes >= 0 ? "+" : "-";
	return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Get date string in YYYY-MM-DD format
 * @param {Date} date - The date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getDateString (date) {
	return date.toISOString().split("T")[0];
}

module.exports = {
	convertWeatherType,
	applyTimezoneOffset,
	limitDecimals,
	getSunTimes,
	isDayTime,
	formatTimezoneOffset,
	getDateString
};
