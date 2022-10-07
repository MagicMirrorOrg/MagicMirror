const helpers = require("./global-setup");
const path = require("path");
const fs = require("fs");
const { generateWeather, generateWeatherForecast } = require("../mocks");

exports.getText = async (element, result) => {
	const elem = await helpers.waitForElement(element);
	expect(elem).not.toBe(null);
	expect(
		elem.textContent
			.trim()
			.replace(/(\r\n|\n|\r)/gm, "")
			.replace(/[ ]+/g, " ")
	).toBe(result);
};

exports.startApp = async (configFile, additionalMockData) => {
	let mockWeather;
	if (configFile.includes("forecast")) {
		mockWeather = generateWeatherForecast(additionalMockData);
	} else {
		mockWeather = generateWeather(additionalMockData);
	}
	let content = fs.readFileSync(path.resolve(__dirname + "../../../../" + configFile)).toString();
	content = content.replace("#####WEATHERDATA#####", mockWeather);
	fs.writeFileSync(path.resolve(__dirname + "../../../../config/config.js"), content);
	helpers.startApplication("");
	await helpers.getDocument();
};
