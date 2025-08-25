const fs = require("node:fs");
const path = require("node:path");
const exec = require("node:child_process").execSync;

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

	const fileData = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/../mocks/${fileName}`)).toString());
	const mergedData = JSON.stringify({ ...{}, ...fileData, ...extendedData });
	return mergedData;
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

const cleanupMockData = () => {
	const tempDir = path.resolve(`${__dirname}/../configs`).toString();
	exec(`find ${tempDir} -type f -name *_temp.js -delete`);
};

module.exports = { injectMockData, cleanupMockData };
