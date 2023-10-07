/* AnimateCSS integration Test with compliments module
 *
 * By bugsounet https://github.com/bugsounet
 * and helped by khassel
 * 09/2023
 * MIT Licensed.
 */
const helpers = require("./helpers/global-setup.js");

describe("AnimateCSS integration Test", () => {
	// define config file for testing
	let testConfigFile = "tests/configs/modules/compliments/compliments_animateCSS.js";
	// define config file to fallback to default: wrong animation name (must return no animation)
	let testConfigFileFallbackToDefault = "tests/configs/modules/compliments/compliments_animateCSS_fallbackToDefault.js";
	// define config file with an inversed name animation : in for out and vice versa (must return no animation)
	let testConfigFileInvertedAnimationName = "tests/configs/modules/compliments/compliments_animateCSS_invertedAnimationName.js";
	// define config file with no animation defined
	let testConfigByDefault = "tests/configs/modules/compliments/compliments_anytime.js";

	/**
	 * move similar tests in function doTest
	 * @param {string} [animationIn] animation in name of AnimateCSS to test.
	 * @param {string} [animationOut] animation out name of AnimateCSS to test.
	 */
	const doTest = async (animationIn, animationOut) => {
		await helpers.getDocument();
		let elem = await helpers.waitForElement(`.compliments`);
		expect(elem).not.toBe(null);
		let styles = window.getComputedStyle(elem);

		if (animationIn && animationIn !== "") {
			expect(styles._values["animation-name"]).toBe(animationIn);
		} else {
			expect(styles._values["animation-name"]).toBe(undefined);
		}

		if (animationOut && animationOut !== "") {
			elem = await helpers.waitForElement(`.compliments.animate__animated.animate__${animationOut}`);
			expect(elem).not.toBe(null);
			styles = window.getComputedStyle(elem);
			expect(styles._values["animation-name"]).toBe(animationOut);
		} else {
			expect(styles._values["animation-name"]).toBe(undefined);
		}
	};

	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("animateIn and animateOut Test", () => {
		it("with flipInX and flipOutX animation", async () => {
			await helpers.startApplication(testConfigFile);
			await doTest("flipInX", "flipOutX");
		});
	});

	describe("use animateOut name for animateIn (vice versa) Test", () => {
		it("without animation", async () => {
			await helpers.startApplication(testConfigFileInvertedAnimationName);
			await doTest();
		});
	});

	describe("false Animation name test", () => {
		it("without animation", async () => {
			await helpers.startApplication(testConfigFileFallbackToDefault);
			await doTest();
		});
	});

	describe("no Animation defined test", () => {
		it("without animation", async () => {
			await helpers.startApplication(testConfigByDefault);
			await doTest();
		});
	});
});
