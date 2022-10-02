const helpers = require("../global-setup");
const path = require("path");
const fs = require("fs");
const { generateWeather, generateWeatherForecast } = require("./mocks");

exports.getText = (done, element, result) => {
	helpers.waitForElement(done, element).then((elem) => {
		expect(elem).not.toBe(null);
		expect(
			elem.textContent
				.trim()
				.replace(/(\r\n|\n|\r)/gm, "")
				.replace(/[ ]+/g, " ")
		).toBe(result);
	});
};

exports.startApp = (configFile, additionalMockData, callback) => {
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
	helpers.getDocument(callback);
};
