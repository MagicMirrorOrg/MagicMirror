const { injectMockData } = require("../../utils/weather_mocker");
const helpers = require("./global-setup");

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

exports.startApp = async (configFileNameName, systemDate) => {
	injectMockData(configFileNameName);
	await helpers.startApplication("", systemDate);
};
