const helpers = require("../helpers/global-setup");
const weatherHelper = require("../helpers/weather-setup");
const { cleanupMockData } = require("../../utils/weather_mocker");

describe("Weather module", () => {
	afterEach(async () => {
		await helpers.stopApplication();
		await cleanupMockData();
	});

	describe("Current weather with sunrise", () => {
		beforeAll(async () => {
			await weatherHelper.startApp("tests/configs/modules/weather/currentweather_default.js", "13 Jan 2019 00:30:00 GMT");
		});

		it("should render sunrise", async () => {
			await expect(weatherHelper.getText(".weather .normal.medium span:nth-child(4)", "7:00 am")).resolves.toBe(true);
		});
	});

	describe("Current weather with sunset", () => {
		beforeAll(async () => {
			await weatherHelper.startApp("tests/configs/modules/weather/currentweather_default.js", "13 Jan 2019 12:30:00 GMT");
		});

		it("should render sunset", async () => {
			await expect(weatherHelper.getText(".weather .normal.medium span:nth-child(4)", "3:45 pm")).resolves.toBe(true);
		});
	});
});
