const helpers = require("../global-setup");

/**
 * move similar tests in function doTest
 *
 * @param {string} done test done
 * @param {Array} complimentsArray The array of compliments.
 */
const doTest = (done, complimentsArray) => {
	helpers.waitForElement(".compliments").then((elem) => {
		expect(elem).not.toBe(null);
		helpers.waitForElement(".module-content").then((elem) => {
			done();
			expect(elem).not.toBe(null);
			expect(complimentsArray).toContain(elem.textContent);
		});
	});
};

describe("Compliments module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("parts of days", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/compliments/compliments_parts_day.js");
			helpers.getDocument(done);
		});

		it("if Morning compliments for that part of day", (done) => {
			const hour = new Date().getHours();
			if (hour >= 3 && hour < 12) {
				// if morning check
				doTest(done, ["Hi", "Good Morning", "Morning test"]);
			} else {
				done();
			}
		});

		it("if Afternoon show Compliments for that part of day", (done) => {
			const hour = new Date().getHours();
			if (hour >= 12 && hour < 17) {
				// if afternoon check
				doTest(done, ["Hello", "Good Afternoon", "Afternoon test"]);
			} else {
				done();
			}
		});

		it("if Evening show Compliments for that part of day", (done) => {
			const hour = new Date().getHours();
			if (!(hour >= 3 && hour < 12) && !(hour >= 12 && hour < 17)) {
				// if evening check
				doTest(done, ["Hello There", "Good Evening", "Evening test"]);
			} else {
				done();
			}
		});
	});

	describe("Feature anytime in compliments module", () => {
		describe("Set anytime and empty compliments for morning, evening and afternoon ", () => {
			beforeAll((done) => {
				helpers.startApplication("tests/configs/modules/compliments/compliments_anytime.js");
				helpers.getDocument(done);
			});

			it("Show anytime because if configure empty parts of day compliments and set anytime compliments", (done) => {
				doTest(done, ["Anytime here"]);
			});
		});

		describe("Only anytime present in configuration compliments", () => {
			beforeAll((done) => {
				helpers.startApplication("tests/configs/modules/compliments/compliments_only_anytime.js");
				helpers.getDocument(done);
			});

			it("Show anytime compliments", (done) => {
				doTest(done, ["Anytime here"]);
			});
		});
	});

	describe("Feature date in compliments module", () => {
		describe("Set date and empty compliments for anytime, morning, evening and afternoon", () => {
			beforeAll((done) => {
				helpers.startApplication("tests/configs/modules/compliments/compliments_date.js");
				helpers.getDocument(done);
			});

			it("Show happy new year compliment on new years day", (done) => {
				doTest(done, ["Happy new year!"]);
			});
		});
	});
});
