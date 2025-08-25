const helpers = require("../helpers/global-setup");

describe("Compliments module", () => {

	/**
	 * move similar tests in function doTest
	 * @param {Array} complimentsArray The array of compliments.
	 * @param {string} state The state of the element (e.g., "visible" or "attached").
	 * @returns {boolean} result
	 */
	const doTest = async (complimentsArray, state = "visible") => {
		await helpers.getElement(".compliments", state);
		const elem = await helpers.getElement(".module-content", state);
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

		it("doesn't show evening compliments during the day when the other parts of day are not set", async () => {
			await helpers.startApplication("tests/configs/modules/compliments/compliments_evening.js", "01 Oct 2022 08:00:00 GMT");
			await expect(doTest([""], "attached")).resolves.toBe(true);
		});
	});

	describe("Feature date in compliments module", () => {
		describe("Set date and empty compliments for anytime, morning, evening and afternoon", () => {
			it("shows happy new year compliment on new years day", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_date.js", "01 Jan 2022 10:00:00 GMT");
				await expect(doTest(["Happy new year!"])).resolves.toBe(true);
			});
		});

		describe("Test only custom date events shown with new property", () => {
			it("shows 'Special day message' on May 6", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_specialDayUnique_true.js", "06 May 2022 10:00:00 GMT");
				await expect(doTest(["Special day message"])).resolves.toBe(true);
			});
		});

		describe("Test all date events shown without new property", () => {
			it("shows 'any message' on May 6", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_specialDayUnique_false.js", "06 May 2022 10:00:00 GMT");
				await expect(doTest(["Special day message", "Typical message 1", "Typical message 2", "Typical message 3"])).resolves.toBe(true);
			});
		});

		describe("Test only custom cron date event shown with new property", () => {
			it("shows 'any message' on May 6", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_cron_entry.js", "06 May 2022 17:03:00 GMT");
				await expect(doTest(["just pub time"])).resolves.toBe(true);
			});
		});

		describe("Test any event shows after time window", () => {
			it("shows 'any message' on May 6", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_cron_entry.js", "06 May 2022 17:11:00 GMT");
				await expect(doTest(["just a test"])).resolves.toBe(true);
			});
		});

		describe("Test any event shows different day", () => {
			it("shows 'any message' on May 5", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_cron_entry.js", "05 May 2022 17:00:00 GMT");
				await expect(doTest(["just a test"])).resolves.toBe(true);
			});
		});
	});

	describe("Feature remote compliments file", () => {
		describe("get list from remote file", () => {
			it("shows 'Remote compliment file works!' as only anytime list set", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_file.js", "01 Jan 2022 10:00:00 GMT");
				await expect(doTest(["Remote compliment file works!"])).resolves.toBe(true);
			});
		});
		describe("get updated list from remote file", () => {
			it("shows 'test in morning'", async () => {
				await helpers.startApplication("tests/configs/modules/compliments/compliments_file_change.js", "01 Jan 2022 10:00:00 GMT");
				await expect(doTest(["Remote compliment file works!"])).resolves.toBe(true);
				await new Promise((r) => setTimeout(r, 10000));
				await expect(doTest(["test in morning"])).resolves.toBe(true);
			});
		});
	});
});
