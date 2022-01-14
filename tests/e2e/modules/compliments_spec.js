const helpers = require("../global-setup");

/**
 * move similar tests in function doTest
 *
 * @param {Array} complimentsArray The array of compliments.
 */
function doTest(complimentsArray) {
	helpers.waitForElement(".compliments").then((elem) => {
		expect(elem).not.toBe(null);
		helpers.waitForElement(".module-content").then((elem) => {
			expect(elem).not.toBe(null);
			expect(complimentsArray).toContain(elem.textContent);
		});
	});
}

describe("Compliments module", function () {
	afterAll(function () {
		helpers.stopApplication();
	});

	describe("parts of days", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/compliments/compliments_parts_day.js");
			helpers.getDocument(done);
		});

		it("if Morning compliments for that part of day", function () {
			const hour = new Date().getHours();
			if (hour >= 3 && hour < 12) {
				// if morning check
				doTest(["Hi", "Good Morning", "Morning test"]);
			}
		});

		it("if Afternoon show Compliments for that part of day", function () {
			const hour = new Date().getHours();
			if (hour >= 12 && hour < 17) {
				// if afternoon check
				doTest(["Hello", "Good Afternoon", "Afternoon test"]);
			}
		});

		it("if Evening show Compliments for that part of day", function () {
			const hour = new Date().getHours();
			if (!(hour >= 3 && hour < 12) && !(hour >= 12 && hour < 17)) {
				// if evening check
				doTest(["Hello There", "Good Evening", "Evening test"]);
			}
		});
	});

	describe("Feature anytime in compliments module", function () {
		describe("Set anytime and empty compliments for morning, evening and afternoon ", function () {
			beforeAll(function (done) {
				helpers.startApplication("tests/configs/modules/compliments/compliments_anytime.js");
				helpers.getDocument(done);
			});

			it("Show anytime because if configure empty parts of day compliments and set anytime compliments", function () {
				doTest(["Anytime here"]);
			});
		});

		describe("Only anytime present in configuration compliments", function () {
			beforeAll(function (done) {
				helpers.startApplication("tests/configs/modules/compliments/compliments_only_anytime.js");
				helpers.getDocument(done);
			});

			it("Show anytime compliments", function () {
				doTest(["Anytime here"]);
			});
		});
	});

	describe("Feature date in compliments module", function () {
		describe("Set date and empty compliments for anytime, morning, evening and afternoon", function () {
			beforeAll(function (done) {
				helpers.startApplication("tests/configs/modules/compliments/compliments_date.js");
				helpers.getDocument(done);
			});

			it("Show happy new year compliment on new years day", function () {
				doTest(["Happy new year!"]);
			});
		});
	});
});
