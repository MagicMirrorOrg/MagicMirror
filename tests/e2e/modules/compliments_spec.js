const helpers = require("../helpers/global-setup");

describe("Compliments module", () => {
	/**
	 * move similar tests in function doTest
	 *
	 * @param {Array} complimentsArray The array of compliments.
	 */
	const doTest = async (complimentsArray) => {
		let elem = await helpers.waitForElement(".compliments");
		expect(elem).not.toBe(null);
		elem = await helpers.waitForElement(".module-content");
		expect(elem).not.toBe(null);
		expect(complimentsArray).toContain(elem.textContent);
	};

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Feature anytime in compliments module", () => {
		describe("Set anytime and empty compliments for morning, evening and afternoon ", () => {
			beforeAll(async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_anytime.js");
				await helpers.getDocument();
			});

			it("Show anytime because if configure empty parts of day compliments and set anytime compliments", async () => {
				await doTest(["Anytime here"]);
			});
		});

		describe("Only anytime present in configuration compliments", () => {
			beforeAll(async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_only_anytime.js");
				await helpers.getDocument();
			});

			it("Show anytime compliments", async () => {
				await doTest(["Anytime here"]);
			});
		});
	});

	describe("remoteFile option", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_remote.js");
			await helpers.getDocument();
		});

		it("should show compliments from a remote file", async () => {
			await doTest(["Remote compliment file works!"]);
		});
	});
});
