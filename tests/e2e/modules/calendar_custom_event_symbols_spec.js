const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

describe("Calendar custom event symbols", () => {
	let page;

	beforeAll(async () => {
		await helpers.startApplication("tests/configs/modules/calendar/custom_event_symbols.js");
		await helpers.getDocument();
		page = helpers.getPage();
	});

	it("should apply a custom symbol class only to matching events", async () => {
		const teslaEvent = page.locator(".calendar .event", { hasText: "TestEventBrandsTeslaIcon" });
		const diceEvent = page.locator(".calendar .event", { hasText: "TestEventCustomEventIcon" });

		await expect(teslaEvent.locator(".fa-tesla")).toHaveCount(1);
		await expect(diceEvent.locator(".fa-dice")).toHaveCount(1);
		await expect(diceEvent.locator(".fab")).toHaveCount(0);
	});
});
