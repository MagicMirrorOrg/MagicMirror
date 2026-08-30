const { expect } = require("playwright/test");
const moment = require("moment");
const helpers = require("../helpers/global-setup");

describe("Clock module", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("with default 24hr clock config", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_24hr.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the date in the correct format", async () => {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			await expect(page.locator(".clock .date")).toHaveText(dateRegex);
		});

		it("should show the time in 24hr format", async () => {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/;
			await expect(page.locator(".clock .time")).toHaveText(timeRegex);
		});
	});

	describe("with default 12hr clock config", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_12hr.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the date in the correct format", async () => {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			await expect(page.locator(".clock .date")).toHaveText(dateRegex);
		});

		it("should show the time in 12hr format", async () => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			await expect(page.locator(".clock .time")).toHaveText(timeRegex);
		});

		it("check for discreet elements of clock", async () => {
			await expect(page.locator(".clock-hour-digital")).toBeVisible();
			await expect(page.locator(".clock-minute-digital")).toBeVisible();
		});
	});

	describe("with showPeriodUpper config enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showPeriodUpper.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show 12hr time with upper case AM/PM", async () => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			await expect(page.locator(".clock .time")).toHaveText(timeRegex);
		});
	});

	describe("with displaySeconds config disabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_displaySeconds_false.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show 12hr time without seconds am/pm", async () => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[ap]m$/;
			await expect(page.locator(".clock .time")).toHaveText(timeRegex);
		});
	});

	describe("with showTime config disabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showTime.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should not show the time when digital clock is shown", async () => {
			await expect(page.locator(".clock .digital .time")).toHaveCount(0);
		});
	});

	describe("with showSun/MoonTime enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showSunMoon.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the sun times", async () => {
			await expect(page.locator(".clock .digital .sun")).toBeVisible();
			await expect(page.locator(".clock .digital .sun .fas.fa-sun")).toBeVisible();
		});

		it("should show the moon times", async () => {
			await expect(page.locator(".clock .digital .moon")).toBeVisible();
		});
	});

	describe("with showSunNextEvent disabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showSunNoEvent.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the sun times", async () => {
			await expect(page.locator(".clock .digital .sun")).toBeVisible();
			await expect(page.locator(".clock .digital .sun .fas.fa-sun")).toHaveCount(0);
		});
	});

	describe("with showWeek config enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showWeek.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the week in the correct format", async () => {
			const weekRegex = /^Week [0-9]{1,2}$/;
			await expect(page.locator(".clock .week")).toHaveText(weekRegex);
		});

		it("should show the week with the correct number of week of year", async () => {
			const currentWeekNumber = moment().week();
			const weekToShow = `Week ${currentWeekNumber}`;
			await expect(page.locator(".clock .week")).toHaveText(weekToShow);
		});
	});

	describe("with showWeek short config enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showWeek_short.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the week in the correct format", async () => {
			const weekRegex = /^W[0-9]{1,2}$/;
			await expect(page.locator(".clock .week")).toHaveText(weekRegex);
		});

		it("should show the week with the correct number of week of year", async () => {
			const currentWeekNumber = moment().week();
			const weekToShow = `W${currentWeekNumber}`;
			await expect(page.locator(".clock .week")).toHaveText(weekToShow);
		});
	});

	describe("with analog clock face enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_analog.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the analog clock face", async () => {
			await expect(page.locator(".clock-circle")).toBeVisible();
		});
	});

	describe("with analog clock face and date enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showDateAnalog.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the analog clock face and the date", async () => {
			await expect(page.locator(".clock-circle")).toBeVisible();
			await expect(page.locator(".clock .date")).toBeVisible();
		});
	});
});
