const helpers = require("../helpers/global-setup");
const weatherHelper = require("../helpers/weather-setup");

describe("Weather module", () => {
	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("Current weather with sunrise", () => {
		beforeAll(async () => {
			await weatherHelper.startApp("tests/configs/modules/weather/currentweather_default.js", "13 Jan 2019 00:30:00 GMT");
		});

		it("should render sunrise", async () => {
			await weatherHelper.getText(".weather .normal.medium span:nth-child(4)", "7:00 am");
		});
	});

	describe("Current weather with sunset", () => {
		beforeAll(async () => {
			await weatherHelper.startApp("tests/configs/modules/weather/currentweather_default.js", "13 Jan 2019 12:30:00 GMT");
		});

		it("should render sunset", async () => {
			await weatherHelper.getText(".weather .normal.medium span:nth-child(4)", "3:45 pm");
		});
	});
});
