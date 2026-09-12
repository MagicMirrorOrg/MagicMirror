const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");
const weatherFunc = require("../helpers/weather-functions");

describe("Weather module: Weather Hourly Forecast", () => {
	let page;

	afterAll(async () => {
		await weatherFunc.stopApplication();
	});

	describe("Default configuration", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/hourlyweather_default.js", "weather_onecall_hourly.json");
			page = helpers.getPage();
		});

		const minTemps = ["7:00 pm", "8:00 pm", "9:00 pm", "10:00 pm", "11:00 pm"];
		for (const [index, hour] of minTemps.entries()) {
			it(`should render forecast for hour ${hour}`, async () => {
				const timeCell = page.locator(`.weather .weather-hourly-row:nth-child(${index + 1}) .time`);
				await expect(timeCell).toHaveText(hour);
			});
		}

		it("should align hourly columns across rows", async () => {
			for (const column of [".time", ".weather-icon", ".temperature"]) {
				const firstCell = await page.locator(`.weather .weather-hourly-row:nth-child(1) ${column}`).boundingBox();
				const secondCell = await page.locator(`.weather .weather-hourly-row:nth-child(2) ${column}`).boundingBox();
				expect(firstCell.x).toBe(secondCell.x);
			}
		});
	});

	describe("Hourly weather options", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/hourlyweather_options.js", "weather_onecall_hourly.json");
			page = helpers.getPage();
		});

		describe("Hourly increments of 2", () => {
			const minTemps = ["7:00 pm", "9:00 pm", "11:00 pm", "1:00 am", "3:00 am"];
			for (const [index, hour] of minTemps.entries()) {
				it(`should render forecast for hour ${hour}`, async () => {
					const timeCell = page.locator(`.weather .weather-hourly-row:nth-child(${index + 1}) .time`);
					await expect(timeCell).toHaveText(hour);
				});
			}
		});
	});

	describe("Show precipitations", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/hourlyweather_showPrecipitation.js", "weather_onecall_hourly.json");
			page = helpers.getPage();
		});

		describe("Shows precipitation amount", () => {
			const amounts = [undefined, undefined, undefined, "0.13 mm", "0.13 mm"];
			for (const [index, amount] of amounts.entries()) {
				if (amount) {
					it(`should render precipitation amount ${amount}`, async () => {
						const amountCell = page.locator(`.weather .weather-hourly-row:nth-child(${index + 1}) .precipitation-amount`);
						await expect(amountCell).toHaveText(amount);
					});
				}
			}
		});

		describe("Shows precipitation probability", () => {
			const probabilities = [undefined, undefined, "12 %", "36 %", "44 %"];
			for (const [index, probability] of probabilities.entries()) {
				if (probability) {
					it(`should render probability ${probability}`, async () => {
						const probabilityCell = page.locator(`.weather .weather-hourly-row:nth-child(${index + 1}) .precipitation-prob`);
						await expect(probabilityCell).toHaveText(probability);
					});
				}
			}
		});

		it("should align precipitation columns across rows", async () => {
			for (const column of [".precipitation-amount", ".precipitation-prob"]) {
				const firstCell = await page.locator(`.weather .weather-hourly-row:nth-child(1) ${column}`).boundingBox();
				const fourthCell = await page.locator(`.weather .weather-hourly-row:nth-child(4) ${column}`).boundingBox();
				expect(firstCell.x).toBe(fourthCell.x);
			}
		});
	});
});
