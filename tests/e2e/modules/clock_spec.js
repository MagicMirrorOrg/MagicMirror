const helpers = require("../global-setup");
const moment = require("moment");

describe("Clock module", function () {
	afterAll(function () {
		helpers.stopApplication();
	});

	const testMatch = function (element, regex) {
		helpers.waitForElement(element).then((elem) => {
			expect(elem).not.toBe(null);
			expect(elem.textContent).toMatch(regex);
		});
	};

	describe("with default 24hr clock config", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/clock/clock_24hr.js");
			helpers.getDocument(done);
		});

		it("should show the date in the correct format", function () {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			testMatch(".clock .date", dateRegex);
		});

		it("should show the time in 24hr format", function () {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/;
			testMatch(".clock .time", timeRegex);
		});
	});

	describe("with default 12hr clock config", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/clock/clock_12hr.js");
			helpers.getDocument(done);
		});

		it("should show the date in the correct format", function () {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			testMatch(".clock .date", dateRegex);
		});

		it("should show the time in 12hr format", function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			testMatch(".clock .time", timeRegex);
		});
	});

	describe("with showPeriodUpper config enabled", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/clock/clock_showPeriodUpper.js");
			helpers.getDocument(done);
		});

		it("should show 12hr time with upper case AM/PM", function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			testMatch(".clock .time", timeRegex);
		});
	});

	describe("with displaySeconds config disabled", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/clock/clock_displaySeconds_false.js");
			helpers.getDocument(done);
		});

		it("should show 12hr time without seconds am/pm", function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[ap]m$/;
			testMatch(".clock .time", timeRegex);
		});
	});

	describe("with showTime config disabled", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/clock/clock_showTime.js");
			helpers.getDocument(done);
		});

		it("should show not show the time when digital clock is shown", function () {
			helpers.waitForElement(".clock .digital .time").then((elem) => {
				expect(elem).toBe(null);
			});
		});
	});

	describe("with showWeek config enabled", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/clock/clock_showWeek.js");
			helpers.getDocument(done);
		});

		it("should show the week in the correct format", function () {
			const weekRegex = /^Week [0-9]{1,2}$/;
			testMatch(".clock .week", weekRegex);
		});

		it("should show the week with the correct number of week of year", function () {
			const currentWeekNumber = moment().week();
			const weekToShow = "Week " + currentWeekNumber;
			helpers.waitForElement(".clock .week").then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent).toBe(weekToShow);
			});
		});
	});

	describe("with analog clock face enabled", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/clock/clock_analog.js");
			helpers.getDocument(done);
		});

		it("should show the analog clock face", () => {
			helpers.waitForElement(".clockCircle").then((elem) => {
				expect(elem).not.toBe(null);
			});
		});
	});
});
