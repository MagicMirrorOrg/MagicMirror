const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
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
	let content = fs.readFileSync(configFileName).toString();
	content = content.replace("#####WEATHERDATA#####", mockWeather);
	const tempFile = configFileName.replace(".js", "_temp.js");
	fs.writeFileSync(tempFile, content);
	return tempFile;
};

const cleanupMockData = async () => {
	const tempDir = path.resolve(`${__dirname}/../configs`).toString();
	await exec(`find ${tempDir} -type f -name *_temp.js -delete`);
};

module.exports = { injectMockData, cleanupMockData };
