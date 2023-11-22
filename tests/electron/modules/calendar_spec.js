const helpers = require("../helpers/global-setup");

describe("Calendar module", () => {
	/**
	 * move similar tests in function doTest
	 * @param {string} cssClass css selector
	 * @returns {boolean} result
	 */
	const doTest = async (cssClass) => {
		let elem = await helpers.getElement(`.calendar .module-content .event${cssClass}`);
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
});
