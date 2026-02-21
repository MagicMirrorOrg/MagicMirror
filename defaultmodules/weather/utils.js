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

module.exports = {
	convertWeatherType,
	applyTimezoneOffset,
	limitDecimals
};
