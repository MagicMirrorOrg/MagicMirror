const helpers = require("../helpers/global-setup");

describe("Calendar module", () => {

	/**
	 * move similar tests in function doTest
	 * @param {string} cssClass css selector
	 * @returns {boolean} result
	 */
	const doTest = async (cssClass) => {
		const elem = await helpers.getElement(`.calendar .module-content .event${cssClass}`);
		await expect(elem.isVisible()).resolves.toBe(true);
		return true;
	};

	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("Test css classes", () => {
		it("has css class dayBeforeYesterday", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "03 Jan 2030 12:30:00 GMT");
			await expect(doTest(".dayBeforeYesterday")).resolves.toBe(true);
		});

		it("has css class yesterday", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "02 Jan 2030 12:30:00 GMT");
			await expect(doTest(".yesterday")).resolves.toBe(true);
		});

		it("has css class today", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "01 Jan 2030 12:30:00 GMT");
			await expect(doTest(".today")).resolves.toBe(true);
		});

		it("has css class tomorrow", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "31 Dec 2029 12:30:00 GMT");
			await expect(doTest(".tomorrow")).resolves.toBe(true);
		});

		it("has css class dayAfterTomorrow", async () => {
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "30 Dec 2029 12:30:00 GMT");
			await expect(doTest(".dayAfterTomorrow")).resolves.toBe(true);
		});
	});

	describe("Exdate check", () => {
		it("should show the recurring event 51 times (excluded once) in a 364-day (inclusive) period", async () => {
			// test must run on a Thursday
			await helpers.startApplication("tests/configs/modules/calendar/exdate.js", "14 Dec 2023 12:30:00 GMT");
			expect(global.page).not.toBeNull();
			const loc = await global.page.locator(".calendar .event");
			const elem = loc.first();
			await elem.waitFor();
			expect(elem).not.toBeNull();
			const cnt = await loc.count();
			expect(cnt).toBe(51);
		});
	});
});
