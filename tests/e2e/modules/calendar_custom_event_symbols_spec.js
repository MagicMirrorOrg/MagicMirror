const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

describe("Calendar custom event symbols", () => {
	let page;

	beforeAll(async () => {
		await helpers.startApplication("tests/configs/modules/calendar/custom_event_symbols.js");
		await helpers.getDocument();
		page = helpers.getPage();
	});

	it("should show a custom event symbol with a custom symbol class", async () => {
		await expect(page.locator(".calendar .event .fa-tesla")).toHaveCount(1);
	});
});
