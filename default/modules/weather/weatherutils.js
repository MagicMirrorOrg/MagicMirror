const WeatherUtils = {

	/**
	 * Convert wind (from m/s) to beaufort scale
	 * @param {number} speedInMS the windspeed you want to convert
	 * @returns {number} the speed in beaufort
	 */
	beaufortWindSpeed (speedInMS) {
		const windInKmh = this.convertWind(speedInMS, "kmh");
		const speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
		for (const [index, speed] of speeds.entries()) {
			if (speed > windInKmh) {
				return index;
			}
		}
		return 12;
	},

	/**
	 * Convert a value in a given unit to a string with a converted
	 * value and a postfix matching the output unit system.
	 * @param {number} value - The value to convert.
	 * @param {string} valueUnit - The unit the values has. Default is mm.
	 * @param {string} outputUnit - The unit system (imperial/metric) the return value should have.
	 * @returns {string} - A string with tha value and a unit postfix.
	 */
	convertPrecipitationUnit (value, valueUnit, outputUnit) {
		if (valueUnit === "%") return `${value.toFixed(0)} ${valueUnit}`;

		let convertedValue = value;
		let conversionUnit = valueUnit;
		if (outputUnit === "imperial") {
			convertedValue = this.convertPrecipitationToInch(value, valueUnit);
			conversionUnit = "in";
		} else {
			conversionUnit = valueUnit ? valueUnit : "mm";
		}

		return `${convertedValue.toFixed(2)} ${conversionUnit}`;
	},

	/**
	 * Convert precipitation value into inch
	 * @param {number} value the precipitation value for convert
	 * @param {string} valueUnit can be 'mm' or 'cm'
	 * @returns {number} the converted precipitation value
	 */
	convertPrecipitationToInch (value, valueUnit) {
		if (valueUnit && valueUnit.toLowerCase() === "cm") return value * 0.3937007874;
		else return value * 0.03937007874;
	},

	/**
	 * Convert temp (from degrees C) into imperial or metric unit depending on
	 * your config
	 * @param {number} tempInC the temperature in Celsius you want to convert
	 * @param {string} unit can be 'imperial' or 'metric'
	 * @returns {number} the converted temperature
	 */
	convertTemp (tempInC, unit) {
		return unit === "imperial" ? tempInC * 1.8 + 32 : tempInC;
	},

	/**
	 * Convert temp (from degrees C) into metric unit
	 * @param {number} tempInF the temperature in Fahrenheit you want to convert
	 * @returns {number} the converted temperature
	 */
	convertTempToMetric (tempInF) {
		return ((tempInF - 32) * 5) / 9;
	},

	/**
	 * Convert wind speed into another unit.
	 * @param {number} windInMS the windspeed in meter/sec you want to convert
	 * @param {string} unit can be 'beaufort', 'kmh', 'knots, 'imperial' (mph)
	 * or 'metric' (mps)
	 * @returns {number} the converted windspeed
	 */
	convertWind (windInMS, unit) {
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
	convertWindDirection (windDirection) {
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

	convertWindToMetric (mph) {
		return mph / 2.2369362920544;
	},

	convertWindToMs (kmh) {
		return kmh * 0.27777777777778;
	},

	/**
	 * Taken from https://community.home-assistant.io/t/calculating-apparent-feels-like-temperature/370834/18
	 * @param {number} temperature temperature in degrees Celsius
	 * @param {number} windSpeed wind speed in meter/second
	 * @param {number} humidity relative humidity in percent
	 * @returns {number} the feels like temperature in degrees Celsius
	 */
	calculateFeelsLike (temperature, windSpeed, humidity) {
		const windInMph = this.convertWind(windSpeed, "imperial");
		const tempInF = this.convertTemp(temperature, "imperial");

		let HI;
		let WC = tempInF;

		// Calculate wind chill for certain conditions
		if (tempInF <= 70 && windInMph >= 3) {
			WC = 35.74 + (0.6215 * tempInF) - 35.75 * Math.pow(windInMph, 0.16) + ((0.4275 * tempInF) * Math.pow(windInMph, 0.16));
		}

		// Steadman Heat Index Vorberechnung
		const STEADMAN_HI = 0.5 * (tempInF + 61.0 + ((tempInF - 68.0) * 1.2) + (humidity * 0.094));

		if (STEADMAN_HI >= 80) {
			// Rothfusz-Komplex
			const ROTHFUSZ_HI = -42.379 + 2.04901523 * tempInF + 10.14333127 * humidity - 0.22475541 * tempInF * humidity - 0.00683783 * tempInF * tempInF - 0.05481717 * humidity * humidity + 0.00122874 * tempInF * tempInF * humidity + 0.00085282 * tempInF * humidity * humidity - 0.00000199 * tempInF * tempInF * humidity * humidity;

			HI = ROTHFUSZ_HI;

			if (humidity < 13 && tempInF > 80 && tempInF < 112) {
				const ADJUSTMENT = ((13 - humidity) / 4) * Math.pow(Math.abs(17 - (tempInF - 95)), 0.5) / 17; // sqrt Teil
				HI = HI - ADJUSTMENT;
			} else if (humidity > 85 && tempInF > 80 && tempInF < 87) {
				const ADJUSTMENT = ((humidity - 85) / 10) * ((87 - tempInF) / 5);
				HI = HI + ADJUSTMENT;
			}

		} else { HI = STEADMAN_HI; }

		// Feuchte Lastberechnung FL
		let FL;
		if (tempInF < 50) { FL = WC; }
		else if (tempInF >= 50 && tempInF < 70) { FL = ((70 - tempInF) / 20) * WC + ((tempInF - 50) / 20) * HI; }
		else if (tempInF >= 70) { FL = HI; }

		return this.convertTempToMetric(FL);
	},

	/**
	 * Converts the Weather Object's values into imperial unit
	 * @param {object} weatherObject the weather object
	 * @returns {object} the weather object with converted values to imperial
	 */
	convertWeatherObjectToImperial (weatherObject) {
		if (!weatherObject || Object.keys(weatherObject).length === 0) return null;

		let imperialWeatherObject = { ...weatherObject };

		if (imperialWeatherObject) {
			if (imperialWeatherObject.feelsLikeTemp) imperialWeatherObject.feelsLikeTemp = this.convertTemp(imperialWeatherObject.feelsLikeTemp, "imperial");
			if (imperialWeatherObject.maxTemperature) imperialWeatherObject.maxTemperature = this.convertTemp(imperialWeatherObject.maxTemperature, "imperial");
			if (imperialWeatherObject.minTemperature) imperialWeatherObject.minTemperature = this.convertTemp(imperialWeatherObject.minTemperature, "imperial");
			if (imperialWeatherObject.precipitationAmount) imperialWeatherObject.precipitationAmount = this.convertPrecipitationToInch(imperialWeatherObject.precipitationAmount, imperialWeatherObject.precipitationUnits);
			if (imperialWeatherObject.temperature) imperialWeatherObject.temperature = this.convertTemp(imperialWeatherObject.temperature, "imperial");
			if (imperialWeatherObject.windSpeed) imperialWeatherObject.windSpeed = this.convertWind(imperialWeatherObject.windSpeed, "imperial");
		}

		return imperialWeatherObject;
	}
};

if (typeof module !== "undefined") {
	module.exports = WeatherUtils;
}
