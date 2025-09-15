const helpers = require("./helpers/global-setup");

// Validate Animate.css integration for compliments module using class toggling.
// We intentionally ignore computed animation styles (jsdom doesn't simulate real animations).
describe("AnimateCSS integration Test", () => {
	// Config variants under test
	const TEST_CONFIG_ANIM = "tests/configs/modules/compliments/compliments_animateCSS.js";
	const TEST_CONFIG_FALLBACK = "tests/configs/modules/compliments/compliments_animateCSS_fallbackToDefault.js"; // invalid animation names
	const TEST_CONFIG_INVERTED = "tests/configs/modules/compliments/compliments_animateCSS_invertedAnimationName.js"; // in/out swapped
	const TEST_CONFIG_NONE = "tests/configs/modules/compliments/compliments_anytime.js"; // no animations defined

	/**
	 * Get the compliments container element (waits until available).
	 * @returns {Promise<HTMLElement>} compliments root element
	 */
	async function getComplimentsElement () {
		await helpers.getDocument();
		const el = await helpers.waitForElement(".compliments");
		expect(el).not.toBeNull();
		return el;
	}

	/**
	 * Wait for an Animate.css class to appear and persist briefly.
	 * @param {string} cls Animation class name without leading dot (e.g. animate__flipInX)
	 * @param {{timeout?: number}} [options] Poll timeout in ms (default 6000)
	 * @returns {Promise<boolean>} true if class detected in time
	 */
	async function waitForAnimationClass (cls, { timeout = 6000 } = {}) {
		const start = Date.now();
		while (Date.now() - start < timeout) {
			if (document.querySelector(`.compliments.animate__animated.${cls}`)) {
				// small stability wait
				await new Promise((r) => setTimeout(r, 50));
				if (document.querySelector(`.compliments.animate__animated.${cls}`)) return true;
			}
			await new Promise((r) => setTimeout(r, 100));
		}
		throw new Error(`Timeout waiting for class ${cls}`);
	}

	/**
	 * Assert that no Animate.css animation class is applied within a time window.
	 * @param {number} [ms] Observation period in ms (default 2000)
	 * @returns {Promise<void>}
	 */
	async function assertNoAnimationWithin (ms = 2000) {
		const start = Date.now();
		while (Date.now() - start < ms) {
			if (document.querySelector(".compliments.animate__animated")) {
				throw new Error("Unexpected animate__animated class present in non-animation scenario");
			}
			await new Promise((r) => setTimeout(r, 100));
		}
	}

	/**
	 * Run one animation test scenario.
	 * @param {string} [animationIn] Expected animate-in name
	 * @param {string} [animationOut] Expected animate-out name
	 * @returns {Promise<boolean>} true when scenario assertions pass
	 */
	async function runAnimationTest (animationIn, animationOut) {
		await getComplimentsElement();
		if (!animationIn && !animationOut) {
			await assertNoAnimationWithin(2000);
			return true;
		}
		if (animationIn) await waitForAnimationClass(`animate__${animationIn}`);
		if (animationOut) {
			// Wait just beyond one update cycle (updateInterval=2000ms) before expecting animateOut.
			await new Promise((r) => setTimeout(r, 2100));
			await waitForAnimationClass(`animate__${animationOut}`);
		}
		return true;
	}

	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("animateIn and animateOut Test", () => {
		it("with flipInX and flipOutX animation", async () => {
			await helpers.startApplication(TEST_CONFIG_ANIM);
			await expect(runAnimationTest("flipInX", "flipOutX")).resolves.toBe(true);
		});
	});

	describe("use animateOut name for animateIn (vice versa) Test", () => {
		it("without animation (inverted names)", async () => {
			await helpers.startApplication(TEST_CONFIG_INVERTED);
			await expect(runAnimationTest()).resolves.toBe(true);
		});
	});

	describe("false Animation name test", () => {
		it("without animation (invalid names)", async () => {
			await helpers.startApplication(TEST_CONFIG_FALLBACK);
			await expect(runAnimationTest()).resolves.toBe(true);
		});
	});

	describe("no Animation defined test", () => {
		it("without animation (no config)", async () => {
			await helpers.startApplication(TEST_CONFIG_NONE);
			await expect(runAnimationTest()).resolves.toBe(true);
		});
	});
});
