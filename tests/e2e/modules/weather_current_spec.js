const helpers = require("../helpers/global-setup");
const weatherFunc = require("../helpers/weather-functions");
const { cleanupMockData } = require("../../utils/weather_mocker");

describe("Weather module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
		await cleanupMockData();
	});

	describe("Current weather", () => {
		describe("Default configuration", () => {
			beforeAll(async () => {
				await weatherFunc.startApp("tests/configs/modules/weather/currentweather_default.js", {});
			});

			it("should render wind speed and wind direction", async () => {
				await expect(weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "12 WSW")).resolves.toBe(true);
			});

			it("should render temperature with icon", async () => {
				await expect(weatherFunc.getText(".weather .large span.light.bright", "1.5°")).resolves.toBe(true);
			});

			it("should render feels like temperature", async () => {
				// Template contains &nbsp; which renders as \xa0
				await expect(weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "93.7\xa0 Feels like -5.6°")).resolves.toBe(true);
			});
			it("should render humidity next to feels-like", async () => {
				await expect(weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed .humidity", "93.7")).resolves.toBe(true);
			});
		});
	});

	describe("Compliments Integration", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/currentweather_compliments.js", {});
		});

		it("should render a compliment based on the current weather", async () => {
			await expect(weatherFunc.getText(".compliments .module-content span", "snow")).resolves.toBe(true);
		});
	});

	describe("Configuration Options", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/currentweather_options.js", {});
		});

		it("should render windUnits in beaufort", async () => {
			await expect(weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "6")).resolves.toBe(true);
		});

		it("should render windDirection with an arrow", async () => {
			const elem = await helpers.waitForElement(".weather .normal.medium sup i.fa-long-arrow-alt-down");
			expect(elem).not.toBeNull();
			expect(elem.outerHTML).toContain("transform:rotate(250deg)");
		});

		it("should render humidity next to wind", async () => {
			await expect(weatherFunc.getText(".weather .normal.medium .humidity", "93.7")).resolves.toBe(true);
		});

		it("should render degreeLabel for temp", async () => {
			await expect(weatherFunc.getText(".weather .large span.bright.light", "1°C")).resolves.toBe(true);
		});

		it("should render degreeLabel for feels like", async () => {
			await expect(weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like -6°C")).resolves.toBe(true);
		});
	});

	describe("Current weather with imperial units", () => {
		beforeAll(async () => {
			await weatherFunc.startApp("tests/configs/modules/weather/currentweather_units.js", {});
		});

		it("should render wind in imperial units", async () => {
			await expect(weatherFunc.getText(".weather .normal.medium span:nth-child(2)", "26 WSW")).resolves.toBe(true);
		});

		it("should render temperatures in fahrenheit", async () => {
			await expect(weatherFunc.getText(".weather .large span.bright.light", "34,7°")).resolves.toBe(true);
		});

		it("should render 'feels like' in fahrenheit", async () => {
			await expect(weatherFunc.getText(".weather .normal.medium.feelslike span.dimmed", "Feels like 21,9°")).resolves.toBe(true);
		});
	});
});
