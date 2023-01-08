const helpers = require("../helpers/global-setup");
const weatherFunc = require("../helpers/weather-functions");

describe("Weather module: Weather Hourly Forecast", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Default configuration", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/hourlyweather_default.js", {});
		});

		const minTemps = ["7:00 pm", "8:00 pm", "9:00 pm", "10:00 pm", "11:00 pm"];
		for (const [index, hour] of minTemps.entries()) {
			it(`should render forecast for hour ${hour}`, async () => {
				await weatherFunc.getText(`.weather table.small tr:nth-child(${index + 1}) td.day`, hour);
			});
		}
	});

	describe("Hourly weather options", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/hourlyweather_options.js", {});
		});

		describe("Hourly increments of 2", () => {
			const minTemps = ["7:00 pm", "9:00 pm", "11:00 pm", "1:00 am", "3:00 am"];
			for (const [index, hour] of minTemps.entries()) {
				it(`should render forecast for hour ${hour}`, async () => {
					await weatherFunc.getText(`.weather table.small tr:nth-child(${index + 1}) td.day`, hour);
				});
			}
		});
	});
});
