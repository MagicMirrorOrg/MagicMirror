const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

describe("Weather module: sunshine hours", () => {
	let page;

	beforeAll(async () => {
		await helpers.startApplication("tests/configs/modules/weather/sunshine_hours.js");
		await helpers.getDocument();
		page = helpers.getPage();
		// eslint-disable-next-line playwright/no-wait-for-selector
		await page.waitForSelector(".weather", { timeout: 5000 });

		await page.evaluate(() => {
			const now = Date.now();
			const day = 24 * 60 * 60 * 1000;
			for (const module of MM.getModules().filter((m) => m.name === "weather")) {
				const data = module.config.type === "current"
					? { date: now, temperature: 18, windSpeed: 3, sunshineHours: 4.6 }
					: [0, 1].map((index) => ({ date: now + index * day, minTemperature: 8, maxTemperature: 18, weatherType: "day-sunny", sunshineHours: index ? null : 7.2 }));
				module.socketNotificationReceived("WEATHER_DATA", { instanceId: module.instanceId, type: module.config.type, data });
			}
		});
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("should show today's sunshine hours in the current weather", async () => {
		await expect(page.locator(".weather .normal.medium .sunshine-hours")).toHaveText("5 h");
	});

	it("should show rounded sunshine hours in the forecast", async () => {
		const rows = page.locator(".weather:not(.sunshine-disabled) .weather-forecast-row");
		await expect(rows.nth(0).locator(".sunshine-hours")).toHaveText("7 h");
		await expect(rows.nth(1).locator(".sunshine-hours")).toHaveText("");
	});

	it("should not show sunshine hours unless enabled", async () => {
		await expect(page.locator(".weather.sunshine-disabled .weather-forecast-row").first()).toBeVisible();
		await expect(page.locator(".weather.sunshine-disabled .sunshine-hours")).toHaveCount(0);
	});
});
