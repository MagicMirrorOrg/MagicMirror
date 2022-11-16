const helpers = require("../global-setup");
const moment = require("moment");

describe("Clock module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	const testMatch = (done, element, regex) => {
		helpers.waitForElement(element).then((elem) => {
			done();
			expect(elem).not.toBe(null);
			expect(elem.textContent).toMatch(regex);
		});
	};

	describe("with default 24hr clock config", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/clock_24hr.js");
			helpers.getDocument(done);
		});

		it("should show the date in the correct format", (done) => {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			testMatch(done, ".clock .date", dateRegex);
		});

		it("should show the time in 24hr format", (done) => {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/;
			testMatch(done, ".clock .time", timeRegex);
		});
	});

	describe("with default 12hr clock config", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/clock_12hr.js");
			helpers.getDocument(done);
		});

		it("should show the date in the correct format", (done) => {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			testMatch(done, ".clock .date", dateRegex);
		});

		it("should show the time in 12hr format", (done) => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			testMatch(done, ".clock .time", timeRegex);
		});
	});

	describe("with showPeriodUpper config enabled", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/clock_showPeriodUpper.js");
			helpers.getDocument(done);
		});

		it("should show 12hr time with upper case AM/PM", (done) => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			testMatch(done, ".clock .time", timeRegex);
		});
	});

	describe("with displaySeconds config disabled", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/clock_displaySeconds_false.js");
			helpers.getDocument(done);
		});

		it("should show 12hr time without seconds am/pm", (done) => {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[ap]m$/;
			testMatch(done, ".clock .time", timeRegex);
		});
	});

	describe("with showTime config disabled", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/clock_showTime.js");
			helpers.getDocument(done);
		});

		it("should not show the time when digital clock is shown", (done) => {
			const elem = document.querySelector(".clock .digital .time");
			done();
			expect(elem).toBe(null);
		});
	});

	describe("with showWeek config enabled", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/clock_showWeek.js");
			helpers.getDocument(done);
		});

		it("should show the week in the correct format", (done) => {
			const weekRegex = /^Week [0-9]{1,2}$/;
			testMatch(done, ".clock .week", weekRegex);
		});

		it("should show the week with the correct number of week of year", (done) => {
			const currentWeekNumber = moment().week();
			const weekToShow = "Week " + currentWeekNumber;
			helpers.waitForElement(".clock .week").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.textContent).toBe(weekToShow);
			});
		});
	});

	describe("with analog clock face enabled", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/clock/clock_analog.js");
			helpers.getDocument(done);
		});

		it("should show the analog clock face", (done) => {
			helpers.waitForElement(".clockCircle").then((elem) => {
				done();
				expect(elem).not.toBe(null);
			});
		});
	});
});
