const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

describe("Clock set to german language module", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("with showWeek config enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/de/clock_showWeek.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("shows week with correct format", async () => {
			const weekRegex = /^[0-9]{1,2}. Kalenderwoche$/;
			await expect(page.locator(".clock .week")).toHaveText(weekRegex);
		});
	});

	describe("with showWeek short config enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/de/clock_showWeek_short.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("shows week with correct format", async () => {
			const weekRegex = /^[0-9]{1,2}KW$/;
			await expect(page.locator(".clock .week")).toHaveText(weekRegex);
		});
	});
});
