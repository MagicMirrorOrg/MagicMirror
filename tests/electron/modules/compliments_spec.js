const helpers = require("../helpers/global-setup");

describe("Compliments module", () => {

	/**
	 * move similar tests in function doTest
	 * @param {Array} complimentsArray The array of compliments.
	 * @returns {boolean} result
	 */
	const doTest = async (complimentsArray) => {
		await helpers.getElement(".compliments");
		const elem = await helpers.getElement(".module-content");
		expect(elem).not.toBeNull();
		expect(complimentsArray).toContain(await elem.textContent());
		return true;
	};

	afterEach(async () => {
		await helpers.stopApplication();
	});

	describe("parts of days", () => {
		it("Morning compliments for that part of day", async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_parts_day.js", "01 Oct 2022 10:00:00 GMT");
			await expect(doTest(["Hi", "Good Morning", "Morning test"])).resolves.toBe(true);
		});

		it("Afternoon show Compliments for that part of day", async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_parts_day.js", "01 Oct 2022 15:00:00 GMT");
			await expect(doTest(["Hello", "Good Afternoon", "Afternoon test"])).resolves.toBe(true);
		});

		it("Evening show Compliments for that part of day", async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_parts_day.js", "01 Oct 2022 20:00:00 GMT");
			await expect(doTest(["Hello There", "Good Evening", "Evening test"])).resolves.toBe(true);
		});
	});

	describe("Feature date in compliments module", () => {
		describe("Set date and empty compliments for anytime, morning, evening and afternoon", () => {
			it("shows happy new year compliment on new years day", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_date.js", "01 Jan 2022 10:00:00 GMT");
				await expect(doTest(["Happy new year!"])).resolves.toBe(true);
			});
		});
	});
});
