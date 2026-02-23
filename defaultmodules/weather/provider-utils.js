/**
 * Shared utility functions for weather providers
 */

const SunCalc = require("suncalc");

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
 * Get date string in YYYY-MM-DD format (local time)
 * @param {Date} date - The date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getDateString (date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Convert wind speed from km/h to m/s
 * @param {number} kmh - Wind speed in km/h
 * @returns {number} Wind speed in m/s
 */
function convertKmhToMs (kmh) {
	return kmh / 3.6;
}

/**
 * Convert cardinal wind direction string to degrees
 * @param {string} direction - Cardinal direction (e.g., "N", "NNE", "SW")
 * @returns {number|null} Direction in degrees (0-360) or null if unknown
 */
function cardinalToDegrees (direction) {
	const directions = {
		N: 0,
		NNE: 22.5,
		NE: 45,
		ENE: 67.5,
		E: 90,
		ESE: 112.5,
		SE: 135,
		SSE: 157.5,
		S: 180,
		SSW: 202.5,
		SW: 225,
		WSW: 247.5,
		W: 270,
		WNW: 292.5,
		NW: 315,
		NNW: 337.5
	};
	return directions[direction] ?? null;
}

/**
 * Validate and limit coordinate precision
 * @param {object} config - Configuration object with lat/lon properties
 * @param {number} maxDecimals - Maximum decimal places to preserve
 * @throws {Error} If coordinates are missing or invalid
 */
function validateCoordinates (config, maxDecimals = 4) {
	if (config.lat == null || config.lon == null
		|| !Number.isFinite(config.lat) || !Number.isFinite(config.lon)) {
		throw new Error("Latitude and longitude are required");
	}

	config.lat = limitDecimals(config.lat, maxDecimals);
	config.lon = limitDecimals(config.lon, maxDecimals);
}

module.exports = {
	convertWeatherType,
	applyTimezoneOffset,
	limitDecimals,
	getSunTimes,
	isDayTime,
	formatTimezoneOffset,
	getDateString,
	convertKmhToMs,
	cardinalToDegrees,
	validateCoordinates
};
