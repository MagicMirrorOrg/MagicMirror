const helpers = require("../helpers/global-setup");

describe("Compliments module", () => {
	/**
	 * move similar tests in function doTest
	 *
	 * @param {Array} complimentsArray The array of compliments.
	 */
	const doTest = async (complimentsArray) => {
		await helpers.getElement(".compliments");
		const elem = await helpers.getElement(".module-content");
		expect(elem).not.toBe(null);
		expect(complimentsArray).toContain(await elem.textContent());
	};

	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("parts of days", () => {
		it("Morning compliments for that part of day", async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_parts_day.js", "01 Oct 2022 10:00:00 GMT");
			await doTest(["Hi", "Good Morning", "Morning test"]);
		});

		it("Afternoon show Compliments for that part of day", async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_parts_day.js", "01 Oct 2022 15:00:00 GMT");
			await doTest(["Hello", "Good Afternoon", "Afternoon test"]);
		});

		it("Evening show Compliments for that part of day", async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_parts_day.js", "01 Oct 2022 20:00:00 GMT");
			await doTest(["Hello There", "Good Evening", "Evening test"]);
		});
	});

	describe("Feature anytime in compliments module", () => {
		describe("Set anytime and empty compliments for morning, evening and afternoon ", () => {
			it("Show anytime because if configure empty parts of day compliments and set anytime compliments", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_anytime.js");
				await doTest(["Anytime here"]);
			});
		});

		describe("Only anytime present in configuration compliments", () => {
			it("Show anytime compliments", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_only_anytime.js");
				await doTest(["Anytime here"]);
			});
		});
	});

	describe("Feature date in compliments module", () => {
		describe("Set date and empty compliments for anytime, morning, evening and afternoon", () => {
			it("Show happy new year compliment on new years day", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_date.js", "01 Jan 2022 10:00:00 GMT");
				await doTest(["Happy new year!"]);
			});
		});
	});

	describe("remoteFile option", () => {
		it("should show compliments from a remote file", async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_remote.js");
			await doTest(["Remote compliment file works!"]);
		});
	});
});
