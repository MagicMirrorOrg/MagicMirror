/* MagicMirror²
 * Weather Util Methods
 *
 * By Rejas
 * MIT Licensed.
 */
const WeatherUtils = {
	/**
	 * Convert wind (from m/s) to beaufort scale
	 *
	 * @param {number} speedInMS the windspeed you want to convert
	 * @returns {number} the speed in beaufort
	 */
	beaufortWindSpeed(speedInMS) {
		const windInKmh = (speedInMS * 3600) / 1000;
		const speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
		for (const [index, speed] of speeds.entries()) {
			if (speed > windInKmh) {
				return index;
			}
		}
		return 12;
	},

	/**
	 * Convert temp (from degrees C) into imperial or metric unit depending on
	 * your config
	 *
	 * @param {number} tempInC the temperature in celsius you want to convert
	 * @param {string} unit can be 'imperial' or 'metric'
	 * @returns {number} the converted temperature
	 */
	convertTemp(tempInC, unit) {
		return unit === "imperial" ? tempInC * 1.8 + 32 : tempInC;
	},

	/**
	 * Convert wind speed into another unit.
	 *
	 * @param {number} windInMS the windspeed in meter/sec you want to convert
	 * @param {string} unit can be 'beaufort', 'kmh', 'knots, 'imperial' (mph)
	 * or 'metric' (mps)
	 * @returns {number} the converted windspeed
	 */
	convertWind(windInMS, unit) {
		switch (unit) {
			case "beaufort":
				return this.beaufortWindSpeed(windInMS);
			case "kmh":
				return (windInMS * 3600) / 1000;
			case "knots":
				return windInMS * 1.943844;
			case "imperial":
				return windInMS * 2.2369362920544;
			case "metric":
			default:
				return windInMS;
		}
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

	convertWindToMetric(mph) {
		return mph / 2.2369362920544;
	},

	convertWindToMs(kmh) {
		return kmh * 0.27777777777778;
	}
};

if (typeof module !== "undefined") {
	module.exports = WeatherUtils;
}
