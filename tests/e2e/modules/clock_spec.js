const moment = require("moment");
const helpers = require("../helpers/global-setup");

describe("Clock module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("with default 24hr clock config", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_24hr.js");
			await helpers.getDocument();
		});

		it("should show the date in the correct format", async () => {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			await expect(helpers.testMatch(".clock .date", dateRegex)).resolves.toBe(true);
		});

		it("should show the time in 24hr format", async () => {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/;
			await expect(helpers.testMatch(".clock .time", timeRegex)).resolves.toBe(true);
		});
	});

	describe("with default 12hr clock config", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_12hr.js");
			await helpers.getDocument();
		});

		it("should show the date in the correct format", async () => {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			await expect(helpers.testMatch(".clock .date", dateRegex)).resolves.toBe(true);
		});

		it("should show the time in 12hr format", async () => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			await expect(helpers.testMatch(".clock .time", timeRegex)).resolves.toBe(true);
		});
	});

	describe("with showPeriodUpper config enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showPeriodUpper.js");
			await helpers.getDocument();
		});

		it("should show 12hr time with upper case AM/PM", async () => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			await expect(helpers.testMatch(".clock .time", timeRegex)).resolves.toBe(true);
		});
	});

	describe("with displaySeconds config disabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_displaySeconds_false.js");
			await helpers.getDocument();
		});

		it("should show 12hr time without seconds am/pm", async () => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[ap]m$/;
			await expect(helpers.testMatch(".clock .time", timeRegex)).resolves.toBe(true);
		});
	});

	describe("with showTime config disabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showTime.js");
			await helpers.getDocument();
		});

		it("should not show the time when digital clock is shown", async () => {
			const elem = document.querySelector(".clock .digital .time");
			expect(elem).toBeNull();
		});
	});

	describe("with showSun/MoonTime enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showSunMoon.js");
			await helpers.getDocument();
		});

		it("should show the sun times", async () => {
			const elem = await helpers.waitForElement(".clock .digital .sun");
			expect(elem).not.toBeNull();
		});

		it("should show the moon times", async () => {
			const elem = await helpers.waitForElement(".clock .digital .moon");
			expect(elem).not.toBeNull();
		});
	});

	describe("with showWeek config enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showWeek.js");
			await helpers.getDocument();
		});

		it("should show the week in the correct format", async () => {
			const weekRegex = /^Week [0-9]{1,2}$/;
			await expect(helpers.testMatch(".clock .week", weekRegex)).resolves.toBe(true);
		});

		it("should show the week with the correct number of week of year", async () => {
			const currentWeekNumber = moment().week();
			const weekToShow = `Week ${currentWeekNumber}`;
			const elem = await helpers.waitForElement(".clock .week");
			expect(elem).not.toBeNull();
			expect(elem.textContent).toBe(weekToShow);
		});
	});

	describe("with analog clock face enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_analog.js");
			await helpers.getDocument();
		});

		it("should show the analog clock face", async () => {
			const elem = helpers.waitForElement(".clock-circle");
			expect(elem).not.toBeNull();
		});
	});

	describe("with analog clock face and date enabled", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/clock/clock_showDateAnalog.js");
			await helpers.getDocument();
		});

		it("should show the analog clock face and the date", async () => {
			const elemClock = helpers.waitForElement(".clock-circle");
			await expect(elemClock).not.toBeNull();
			const elemDate = helpers.waitForElement(".clock .date");
			await expect(elemDate).not.toBeNull();
		});
	});
});
