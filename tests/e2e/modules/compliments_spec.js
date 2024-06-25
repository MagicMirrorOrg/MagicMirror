const helpers = require("../helpers/global-setup");

describe("Compliments module", () => {

	/**
	 * move similar tests in function doTest
	 * @param {Array} complimentsArray The array of compliments.
	 * @returns {boolean} result
	 */
	const doTest = async (complimentsArray) => {
		let elem = await helpers.waitForElement(".compliments");
		expect(elem).not.toBeNull();
		elem = await helpers.waitForElement(".module-content");
		expect(elem).not.toBeNull();
		expect(complimentsArray).toContain(elem.textContent);
		return true;
	};

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Feature anytime in compliments module", () => {
		describe("Set anytime and empty compliments for morning, evening and afternoon", () => {
			beforeAll(async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_anytime.js");
				await helpers.getDocument();
			});

			it("shows anytime because if configure empty parts of day compliments and set anytime compliments", async () => {
				await expect(doTest(["Anytime here"])).resolves.toBe(true);
			});
		});

		describe("Only anytime present in configuration compliments", () => {
			beforeAll(async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_only_anytime.js");
				await helpers.getDocument();
			});

			it("shows anytime compliments", async () => {
				await expect(doTest(["Anytime here"])).resolves.toBe(true);
			});
		});
	});

	describe("remoteFile option", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_remote.js");
			await helpers.getDocument();
		});

		it("should show compliments from a remote file", async () => {
			await expect(doTest(["Remote compliment file works!"])).resolves.toBe(true);
		});
	});

	/*   CAN'T TEST ANY OF THESE AS THE START APPLICATION HELPER IN E2E DOES NOT ACCEPT TIME AS A VALUE
	describe("Feature date in compliments module", () => {
		describe("Test only custom date events shown with new property", () => {
			it("shows 'Special day message' on May 6", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_specialDayUnique_true.js", "06 May 2022 10:00:00 GMT");
				await helpers.getDocument();
				await expect(doTest(["Special day message"])).resolves.toBe(true);
			});
		});

		describe("Test all date events shown without new property", () => {
			it("shows 'any message' on May 6", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_specialDayUnique_false.js", "06 May 2022 10:00:00 GMT");
				await helpers.getDocument();
				await expect(doTest(["Special day message", "Typical message 1", "Typical message 2", "Typical message 3"])).resolves.toBe(true);
			});
		});

		describe("Test only custom cron date event shown with new property", () => {
			it("shows 'any message' on May 6", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_cron_entry.js", "06 May 2022 17:03:00 GMT");
				await helpers.getDocument();
				await expect(doTest(["just pub time"])).resolves.toBe(true);
			});
		});

		describe("Test any event shows after time window", () => {
			it("shows 'any message' on May 6", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_cron_entry.js", "06 May 2022 17:11:00 GMT");
				await helpers.getDocument();
				await expect(doTest(["just a test"])).resolves.toBe(true);
			});
		});

		describe("Test any event shows different day", () => {
			it("shows 'any message' on May 5", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_cron_entry.js", "05 May 2022 17:00:00 GMT");
				await helpers.getDocument();
				await expect(doTest(["just a test"])).resolves.toBe(true);
			});
		});
	}); */
});
