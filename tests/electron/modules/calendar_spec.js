const helpers = require("../helpers/global-setup");

describe("Calendar module", () => {
	/**
	 * move similar tests in function doTest
	 *
	 * @param {string} cssClass css selector
	 */
	const doTest = async (cssClass) => {
		await helpers.getElement(".calendar");
		await helpers.getElement(".module-content");
		const events = await global.page.locator(".event");
		const elem = await events.locator(cssClass);
		expect(elem).not.toBe(null);
	};

	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("Test css classes", () => {
		it("has css class today", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "01 Jan 2030 12:30:00 GMT");
			await doTest(".today");
		});

		it("has css class tomorrow", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "31 Dez 2029 12:30:00 GMT");
			await doTest(".tomorrow");
		});
	});
});
