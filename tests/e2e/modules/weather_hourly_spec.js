const helpers = require("../helpers/global-setup");
const weatherFunc = require("../helpers/weather-functions");
const { cleanupMockData } = require("../../utils/weather_mocker");

describe("Weather module: Weather Hourly Forecast", () => {
	afterAll(async () => {
		await helpers.stopApplication();
		await cleanupMockData();
	});

	describe("Default configuration", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/hourlyweather_default.js", {});
		});

		const minTemps = ["7:00 pm", "8:00 pm", "9:00 pm", "10:00 pm", "11:00 pm"];
		for (const [index, hour] of minTemps.entries()) {
			it(`should render forecast for hour ${hour}`, async () => {
				await expect(weatherFunc.getText(`.weather table.small tr:nth-child(${index + 1}) td.day`, hour)).resolves.toBe(true);
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
					await expect(weatherFunc.getText(`.weather table.small tr:nth-child(${index + 1}) td.day`, hour)).resolves.toBe(true);
				});
			}
		});
	});

	describe("Show precipitations", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/hourlyweather_showPrecipitation.js", {});
		});

		describe("Shows precipitation amount", () => {
			const amounts = [undefined, undefined, undefined, "0.13 mm", "0.13 mm"];
			for (const [index, amount] of amounts.entries()) {
				if (amount) {
					it(`should render precipitation amount ${amount}`, async () => {
						await expect(weatherFunc.getText(`.weather table.small tr:nth-child(${index + 1}) td.precipitation-amount`, amount)).resolves.toBe(true);
					});
				}
			}
		});

		describe("Shows precipitation probability", () => {
			const probabilities = [undefined, undefined, "12 %", "36 %", "44 %"];
			for (const [index, pop] of probabilities.entries()) {
				if (pop) {
					it(`should render probability ${pop}`, async () => {
						await expect(weatherFunc.getText(`.weather table.small tr:nth-child(${index + 1}) td.precipitation-prob`, pop)).resolves.toBe(true);
					});
				}
			}
		});
	});
});
