const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

describe("Calendar event date and time display options", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("absolute mode: date-only", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-absolute-date-only.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display only the configured information", async () => {
			await expect(page.locator(".calendar .event .time").first()).toBeVisible();
			await expect(page.locator(".calendar .event .time").first()).not.toBeEmpty();
		});
	});

	describe("absolute mode: time-only", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-absolute-time-only.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display only the configured information", async () => {
			await expect(page.locator(".calendar .event .time").first()).toBeVisible();
			await expect(page.locator(".calendar .event .time").first()).not.toBeEmpty();
		});
	});

	describe("absolute mode: title-only", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-absolute-title-only.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display only the configured information", async () => {
			await expect(page.locator(".calendar .event .time")).toHaveCount(0);
			await expect(page.locator(".calendar .event .title").first()).toBeVisible();
			await expect(page.locator(".calendar .event .title").first()).toContainText("TestEvent");
		});
	});

	describe("relative mode: date-only", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-relative-date-only.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display only the configured information", async () => {
			await expect(page.locator(".calendar .event .time").first()).toBeVisible();
			await expect(page.locator(".calendar .event .time").first()).not.toBeEmpty();
		});
	});

	describe("relative mode: time-only", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-relative-time-only.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display only the configured information", async () => {
			await expect(page.locator(".calendar .event .time").first()).toBeVisible();
			await expect(page.locator(".calendar .event .time").first()).not.toBeEmpty();
		});
	});

	describe("relative mode: title-only", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-relative-title-only.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display only the configured information", async () => {
			await expect(page.locator(".calendar .event .time")).toHaveCount(0);
			await expect(page.locator(".calendar .event .title").first()).toBeVisible();
			await expect(page.locator(".calendar .event .title").first()).toContainText("TestEvent");
		});
	});

	describe("dateheaders mode: date-only", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-dateheaders-date-only.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display only the configured information", async () => {
			await expect(page.locator(".calendar .dateheader").first()).toBeVisible();
			await expect(page.locator(".calendar .event .time")).toHaveCount(0);
		});
	});

	describe("dateheaders mode: date-only with multi-day all-day event", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-dateheaders-multiday-allday.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display the end date without displaying event time", async () => {
			const dateValue = page.locator(".calendar .event .time").first();
			await expect(page.locator(".calendar .event .title")).toContainText("Multi-day all-day test ev");
			await expect(dateValue).toBeVisible();
			await expect(dateValue).toHaveText("-2030-01-02");
		});
	});

	describe("dateheaders mode: time-only", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-dateheaders-time-only.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display only the configured information", async () => {
			await expect(page.locator(".calendar .dateheader")).toHaveCount(0);
			await expect(page.locator(".calendar .event .time").first()).toBeVisible();
		});
	});

	describe("dateheaders mode: title-only", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/calendar/display-dateheaders-title-only.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should display only the configured information", async () => {
			await expect(page.locator(".calendar .dateheader")).toHaveCount(0);
			await expect(page.locator(".calendar .event .time")).toHaveCount(0);
			await expect(page.locator(".calendar .event .title").first()).toBeVisible();
			await expect(page.locator(".calendar .event .title").first()).toContainText("TestEvent");
		});
	});

});
