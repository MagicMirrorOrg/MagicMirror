const helpers = require("./global-setup");
const path = require("path");
const fs = require("fs");
const { generateWeather, generateWeatherForecast } = require("../../mocks/weather_test");

exports.getText = async (element, result) => {
	const elem = await helpers.getElement(element);
	await expect(elem).not.toBe(null);
	const text = await elem.textContent();
	await expect(
		text
			.trim()
			.replace(/(\r\n|\n|\r)/gm, "")
			.replace(/[ ]+/g, " ")
	).toBe(result);
};

exports.startApp = async (configFile, systemDate) => {
	let mockWeather;
	if (configFile.includes("forecast")) {
		mockWeather = generateWeatherForecast();
	} else {
		mockWeather = generateWeather();
	}
	let content = fs.readFileSync(path.resolve(__dirname + "../../../../" + configFile)).toString();
	content = content.replace("#####WEATHERDATA#####", mockWeather);
	fs.writeFileSync(path.resolve(__dirname + "../../../../config/config.js"), content);
	await helpers.startApplication("", systemDate);
};
