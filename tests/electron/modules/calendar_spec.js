const helpers = require("../helpers/global-setup");

describe("Calendar module", () => {
	/**
	 * move similar tests in function doTest
	 *
	 * @param {string} cssClass css selector
	 */
	const doTest = async (cssClass) => {
		let elem = await helpers.getElement(".calendar .module-content .event" + cssClass);
		expect(await elem.isVisible()).toBe(true);
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
			await helpers.startApplication("tests/configs/modules/calendar/custom.js", "31 Dec 2029 12:30:00 GMT");
			await doTest(".tomorrow");
		});
	});
});
