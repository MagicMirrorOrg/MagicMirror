const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");
const weatherFunc = require("../helpers/weather-functions");

describe("Weather module: Weather Forecast", () => {
	let page;

	afterAll(async () => {
		await weatherFunc.stopApplication();
	});

	describe("Default configuration", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/forecastweather_default.js", "weather_onecall_forecast.json");
			page = helpers.getPage();
		});

		const days = ["Today", "Tomorrow", "Sun", "Mon", "Tue"];
		for (const [index, day] of days.entries()) {
			it(`should render day ${day}`, async () => {
				const dayCell = page.locator(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`);
				await expect(dayCell).toHaveText(day);
			});
		}

		const icons = ["day-cloudy", "rain", "day-sunny", "day-sunny", "day-sunny"];
		for (const [index, icon] of icons.entries()) {
			it(`should render icon ${icon}`, async () => {
				const iconElement = page.locator(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(2) span.wi-${icon}`);
				await expect(iconElement).toBeVisible();
			});
		}

		const maxTemps = ["24.4°", "21.0°", "22.9°", "23.4°", "20.6°"];
		for (const [index, temp] of maxTemps.entries()) {
			it(`should render max temperature ${temp}`, async () => {
				const maxTempCell = page.locator(`.weather table.small tr:nth-child(${index + 1}) td.max-temp`);
				await expect(maxTempCell).toHaveText(temp);
			});
		}

		const minTemps = ["15.3°", "13.6°", "13.8°", "13.9°", "10.9°"];
		for (const [index, temp] of minTemps.entries()) {
			it(`should render min temperature ${temp}`, async () => {
				const minTempCell = page.locator(`.weather table.small tr:nth-child(${index + 1}) td.min-temp`);
				await expect(minTempCell).toHaveText(temp);
			});
		}

		const opacities = [1, 1, 0.8, 0.5333333333333333, 0.2666666666666667];
		for (const [index, opacity] of opacities.entries()) {
			it(`should render fading of rows with opacity=${opacity}`, async () => {
				const row = page.locator(`.weather table.small tr:nth-child(${index + 1})`);
				await expect(row).toHaveAttribute("style", `opacity: ${opacity};`);
			});
		}
	});

	describe("Absolute configuration", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/forecastweather_absolute.js", "weather_onecall_forecast.json");
			page = helpers.getPage();
		});

		const days = ["Fri", "Sat", "Sun", "Mon", "Tue"];
		for (const [index, day] of days.entries()) {
			it(`should render day ${day}`, async () => {
				const dayCell = page.locator(`.weather table.small tr:nth-child(${index + 1}) td:nth-child(1)`);
				await expect(dayCell).toHaveText(day);
			});
		}
	});

	describe("Configuration Options", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/forecastweather_options.js", "weather_onecall_forecast.json");
			page = helpers.getPage();
		});

		it("should render custom table class", async () => {
			await expect(page.locator(".weather table.myTableClass")).toBeVisible();
		});

		it("should render colored rows", async () => {
			const rows = page.locator(".weather table.myTableClass tr");
			await expect(rows).toHaveCount(5);
		});

		const precipitations = [undefined, "2.51 mm"];
		for (const [index, precipitation] of precipitations.entries()) {
			if (precipitation) {
				it(`should render precipitation amount ${precipitation}`, async () => {
					const precipCell = page.locator(`.weather table tr:nth-child(${index + 1}) td.precipitation-amount`);
					await expect(precipCell).toHaveText(precipitation);
				});
			}
		}
	});

	describe("Forecast weather with imperial units", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/forecastweather_units.js", "weather_onecall_forecast.json");
			page = helpers.getPage();
		});

		describe("Temperature units", () => {
			const temperatures = ["75_9°", "69_8°", "73_2°", "74_1°", "69_1°"];
			for (const [index, temp] of temperatures.entries()) {
				it(`should render custom decimalSymbol = '_' for temp ${temp}`, async () => {
					const tempCell = page.locator(`.weather table.small tr:nth-child(${index + 1}) td.max-temp`);
					await expect(tempCell).toHaveText(temp);
				});
			}
		});

		describe("Precipitation units", () => {
			const precipitations = [undefined, "0.10 in"];
			for (const [index, precipitation] of precipitations.entries()) {
				if (precipitation) {
					it(`should render precipitation amount ${precipitation}`, async () => {
						const precipCell = page.locator(`.weather table.small tr:nth-child(${index + 1}) td.precipitation-amount`);
						await expect(precipCell).toHaveText(precipitation);
					});
				}
			}
		});
	});
});
