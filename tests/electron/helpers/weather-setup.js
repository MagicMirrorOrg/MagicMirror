const { injectMockData } = require("../../utils/weather_mocker");
const helpers = require("./global-setup");

exports.getText = async (element, result) => {
	const elem = await helpers.getElement(element);
	await expect(elem).not.toBeNull();
	const text = await elem.textContent();
	await expect(
		text
			.trim()
			.replace(/(\r\n|\n|\r)/gm, "")
			.replace(/[ ]+/g, " ")
	).toBe(result);
	return true;
};

exports.startApp = async (configFileName, systemDate) => {
	await helpers.startApplication(injectMockData(configFileName), systemDate);
};
