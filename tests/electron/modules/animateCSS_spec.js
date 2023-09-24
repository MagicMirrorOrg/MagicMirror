/* AnimateCSS integration Test with compliments module
 *
 * By bugsounet https://github.com/bugsounet
 * 09/2023
 * MIT Licensed.
 */
const helpers = require("../helpers/global-setup");

describe("AnimateCSS integration Test", () => {
	// define config file for testing
	let testConfigFile = "tests/configs/modules/compliments/compliments_animateCSS.js";

	/**
	 * move similar tests in function doTest
	 * @param {string} [animationName] animation name of AnimateCSS to test.
	 */
	const doTest = async (animationName) => {
		let elem = await helpers.getElement(`.compliments.animate__animated.animate__${animationName}`);
		expect(await elem.isVisible()).toBe(true);
	};

	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("AnimatedIn Test", () => {
		it("with flipInX animation", async () => {
			await helpers.startApplication(testConfigFile);
			await doTest("flipInX");
		});
	});

	describe("AnimatedOut Test", () => {
		it("with flipOutX animation", async () => {
			await helpers.startApplication(testConfigFile);
			await doTest("flipOutX");
		});
	});
});
