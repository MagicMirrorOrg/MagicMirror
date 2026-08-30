const { expect } = require("playwright/test");
const helpers = require("./helpers/global-setup");

// Validate Animate.css integration for compliments module using class toggling.
// We intentionally ignore computed animation styles (jsdom doesn't simulate real animations).
describe("AnimateCSS integration Test", () => {
	let page;

	// Config variants under test
	const TEST_CONFIG_ANIM = "tests/configs/modules/compliments/compliments_animateCSS.js";
	const TEST_CONFIG_FALLBACK = "tests/configs/modules/compliments/compliments_animateCSS_fallbackToDefault.js"; // invalid animation names
	const TEST_CONFIG_INVERTED = "tests/configs/modules/compliments/compliments_animateCSS_invertedAnimationName.js"; // in/out swapped
	const TEST_CONFIG_NONE = "tests/configs/modules/compliments/compliments_anytime.js"; // no animations defined

	/**
	 * Get the compliments container element (waits until available).
	 * @returns {Promise<void>}
	 */
	async function getComplimentsElement () {
		await helpers.getDocument();
		page = helpers.getPage();
		await expect(page.locator(".compliments")).toBeVisible();
	}

	/**
	 * Wait for an Animate.css class to appear and persist briefly.
	 * @param {string} cls Animation class name without leading dot (e.g. animate__flipInX)
	 * @param {{timeout?: number}} [options] Poll timeout in ms (default 6000)
	 * @returns {Promise<void>}
	 */
	async function waitForAnimationClass (cls, { timeout = 6000 } = {}) {
		const locator = page.locator(`.compliments.animate__animated.${cls}`);
		await locator.waitFor({ state: "attached", timeout });
		// small stability wait
		await new Promise((r) => setTimeout(r, 50));
		await expect(locator).toBeAttached();
	}

	/**
	 * Assert that no Animate.css animation class is applied within a time window.
	 * @param {number} [ms] Observation period in ms (default 2000)
	 * @returns {Promise<void>}
	 */
	async function assertNoAnimationWithin (ms = 2000) {
		const start = Date.now();
		const locator = page.locator(".compliments.animate__animated");
		while (Date.now() - start < ms) {
			const count = await locator.count();
			if (count > 0) {
				throw new Error("Unexpected animate__animated class present in non-animation scenario");
			}
			await new Promise((r) => setTimeout(r, 100));
		}
	}

	/**
	 * Run one animation test scenario.
	 * @param {string} [animationIn] Expected animate-in name
	 * @param {string} [animationOut] Expected animate-out name
	 * @returns {Promise<void>} Throws on assertion failure
	 */
	async function runAnimationTest (animationIn, animationOut) {
		await getComplimentsElement();
		if (!animationIn && !animationOut) {
			await assertNoAnimationWithin(2000);
			return;
		}
		if (animationIn) await waitForAnimationClass(`animate__${animationIn}`);
		if (animationOut) {
			// Wait just beyond one update cycle (updateInterval=2000ms) before expecting animateOut.
			await new Promise((r) => setTimeout(r, 2100));
			await waitForAnimationClass(`animate__${animationOut}`);
		}
	}

	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("animateIn and animateOut Test", () => {
		it("with flipInX and flipOutX animation", async () => {
			await helpers.startApplication(TEST_CONFIG_ANIM);
			await runAnimationTest("flipInX", "flipOutX");
		});
	});

	describe("use animateOut name for animateIn (vice versa) Test", () => {
		it("without animation (inverted names)", async () => {
			await helpers.startApplication(TEST_CONFIG_INVERTED);
			await runAnimationTest();
		});
	});

	describe("false Animation name test", () => {
		it("without animation (invalid names)", async () => {
			await helpers.startApplication(TEST_CONFIG_FALLBACK);
			await runAnimationTest();
		});
	});

	describe("no Animation defined test", () => {
		it("without animation (no config)", async () => {
			await helpers.startApplication(TEST_CONFIG_NONE);
			await runAnimationTest();
		});
	});
});
