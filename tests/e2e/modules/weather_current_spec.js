const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");
const weatherFunc = require("../helpers/weather-functions");

describe("Weather module", () => {
	let page;

	afterAll(async () => {
		await weatherFunc.stopApplication();
	});

	describe("Current weather", () => {
		describe("Default configuration", () => {
			beforeAll(async () => {
				await weatherFunc.startApplication("tests/configs/modules/weather/currentweather_default.js", "weather_onecall_current.json");
				page = helpers.getPage();
			});

			it("should render wind speed and wind direction", async () => {
				await expect(page.locator(".weather .normal.medium span:nth-child(2)")).toHaveText("12 WSW");
			});

			it("should render temperature with icon", async () => {
				await expect(page.locator(".weather .large span.light.bright")).toHaveText("1.5°");
				await expect(page.locator(".weather .large span.weathericon")).toBeVisible();
			});

			it("should render feels like temperature", async () => {
				// Template contains &nbsp; which renders as \xa0
				await expect(page.locator(".weather .normal.medium.feelslike span.dimmed")).toHaveText("93.7\xa0 Feels like -5.6°");
			});

			it("should render humidity next to feels-like", async () => {
				await expect(page.locator(".weather .normal.medium.feelslike span.dimmed .humidity")).toHaveText("93.7");
			});
		});
	});

	describe("Compliments Integration", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/currentweather_compliments.js", "weather_onecall_current.json");
			page = helpers.getPage();
		});

		it("should render a compliment based on the current weather", async () => {
			const compliment = page.locator(".compliments .module-content span");
			await compliment.waitFor({ state: "visible" });
			await expect(compliment).toHaveText("snow");
		});
	});

	describe("Configuration Options", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/currentweather_options.js", "weather_onecall_current.json");
			page = helpers.getPage();
		});

		it("should render windUnits in beaufort", async () => {
			await expect(page.locator(".weather .normal.medium span:nth-child(2)")).toHaveText("6");
		});

		it("should render windDirection with an arrow", async () => {
			const arrow = page.locator(".weather .normal.medium sup i.fa-long-arrow-alt-down");
			await expect(arrow).toHaveAttribute("style", "transform:rotate(250deg)");
		});

		it("should render humidity next to wind", async () => {
			await expect(page.locator(".weather .normal.medium .humidity")).toHaveText("93.7");
		});

		it("should render degreeLabel for temp", async () => {
			await expect(page.locator(".weather .large span.bright.light")).toHaveText("1°C");
		});

		it("should render degreeLabel for feels like", async () => {
			await expect(page.locator(".weather .normal.medium.feelslike span.dimmed")).toHaveText("Feels like -6°C");
		});
	});

	describe("Current weather with imperial units", () => {
		beforeAll(async () => {
			await weatherFunc.startApplication("tests/configs/modules/weather/currentweather_units.js", "weather_onecall_current.json");
			page = helpers.getPage();
		});

		it("should render wind in imperial units", async () => {
			await expect(page.locator(".weather .normal.medium span:nth-child(2)")).toHaveText("26 WSW");
		});

		it("should render temperatures in fahrenheit", async () => {
			await expect(page.locator(".weather .large span.bright.light")).toHaveText("34,7°");
		});

		it("should render 'feels like' in fahrenheit", async () => {
			await expect(page.locator(".weather .normal.medium.feelslike span.dimmed")).toHaveText("Feels like 21,9°");
		});
	});
});
