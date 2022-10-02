const helpers = require("../global-setup");

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

	describe("parts of days", () => {
		beforeAll(async () => {
			helpers.startApplication("tests/configs/modules/compliments/compliments_parts_day.js");
			await helpers.getDocument();
		});

		it("if Morning compliments for that part of day", async () => {
			const hour = new Date().getHours();
			if (hour >= 3 && hour < 12) {
				// if morning check
				await doTest(["Hi", "Good Morning", "Morning test"]);
			}
		});

		it("if Afternoon show Compliments for that part of day", async () => {
			const hour = new Date().getHours();
			if (hour >= 12 && hour < 17) {
				// if afternoon check
				await doTest(["Hello", "Good Afternoon", "Afternoon test"]);
			}
		});

		it("if Evening show Compliments for that part of day", async () => {
			const hour = new Date().getHours();
			if (!(hour >= 3 && hour < 12) && !(hour >= 12 && hour < 17)) {
				// if evening check
				await doTest(["Hello There", "Good Evening", "Evening test"]);
			}
		});
	});

	describe("Feature anytime in compliments module", () => {
		describe("Set anytime and empty compliments for morning, evening and afternoon ", () => {
			beforeAll(async () => {
				helpers.startApplication("tests/configs/modules/compliments/compliments_anytime.js");
				await helpers.getDocument();
			});

			it("Show anytime because if configure empty parts of day compliments and set anytime compliments", async () => {
				await doTest(["Anytime here"]);
			});
		});

		describe("Only anytime present in configuration compliments", () => {
			beforeAll(async () => {
				helpers.startApplication("tests/configs/modules/compliments/compliments_only_anytime.js");
				await helpers.getDocument();
			});

			it("Show anytime compliments", async () => {
				await doTest(["Anytime here"]);
			});
		});
	});

	describe("Feature date in compliments module", () => {
		describe("Set date and empty compliments for anytime, morning, evening and afternoon", () => {
			beforeAll(async () => {
				helpers.startApplication("tests/configs/modules/compliments/compliments_date.js");
				await helpers.getDocument();
			});

			it("Show happy new year compliment on new years day", async () => {
				await doTest(["Happy new year!"]);
			});
		});
	});
});
