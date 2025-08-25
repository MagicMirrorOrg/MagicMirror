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
	 * @param {number} tempInC the temperature in celsius you want to convert
	 * @param {string} unit can be 'imperial' or 'metric'
	 * @returns {number} the converted temperature
	 */
	convertTemp (tempInC, unit) {
		return unit === "imperial" ? tempInC * 1.8 + 32 : tempInC;
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

	calculateFeelsLike (temperature, windSpeed, humidity) {
		const windInMph = this.convertWind(windSpeed, "imperial");
		const tempInF = this.convertTemp(temperature, "imperial");
		let feelsLike = tempInF;

		if (windInMph > 3 && tempInF < 50) {
			feelsLike = Math.round(35.74 + 0.6215 * tempInF - 35.75 * Math.pow(windInMph, 0.16) + 0.4275 * tempInF * Math.pow(windInMph, 0.16));
		} else if (tempInF > 80 && humidity > 40) {
			feelsLike
				= -42.379
				  + 2.04901523 * tempInF
				  + 10.14333127 * humidity
				  - 0.22475541 * tempInF * humidity
				  - 6.83783 * Math.pow(10, -3) * tempInF * tempInF
				  - 5.481717 * Math.pow(10, -2) * humidity * humidity
				  + 1.22874 * Math.pow(10, -3) * tempInF * tempInF * humidity
				  + 8.5282 * Math.pow(10, -4) * tempInF * humidity * humidity
				  - 1.99 * Math.pow(10, -6) * tempInF * tempInF * humidity * humidity;
		}

		return ((feelsLike - 32) * 5) / 9;
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
