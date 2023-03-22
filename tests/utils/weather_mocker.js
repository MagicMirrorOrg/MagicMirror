const fs = require("fs");
const path = require("path");
const _ = require("lodash");

/**
 * @param {string} type what data to read, can be "current" "forecast" or "hourly
 * @param {object} extendedData extra data to add to the default mock data
 * @returns {string} mocked current weather data
 */
const readMockData = (type, extendedData = {}) => {
	let fileName;

	switch (type) {
		case "forecast":
			fileName = "weather_forecast.json";
			break;
		case "hourly":
			fileName = "weather_hourly.json";
			break;
		case "current":
		default:
			fileName = "weather_current.json";
			break;
	}

	return JSON.stringify(_.merge({}, JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/../mocks/${fileName}`)).toString()), extendedData));
};

const injectMockData = (configFileName, extendedData = {}) => {
	let mockWeather;
	if (configFileName.includes("forecast")) {
		mockWeather = readMockData("forecast", extendedData);
	} else if (configFileName.includes("hourly")) {
		mockWeather = readMockData("hourly", extendedData);
	} else {
		mockWeather = readMockData("current", extendedData);
	}
	let content = fs.readFileSync(path.resolve(`${__dirname}../../../${configFileName}`)).toString();
	content = content.replace("#####WEATHERDATA#####", mockWeather);
	fs.writeFileSync(path.resolve(`${__dirname}../../../config/config.js`), content);
};

module.exports = { injectMockData };
