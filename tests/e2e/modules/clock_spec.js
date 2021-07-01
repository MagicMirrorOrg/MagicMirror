const helpers = require("../global-setup");
const moment = require("moment");

describe("Clock module", function () {
	helpers.setupTimeout(this);

	let app = null;

	testMatch = async function (element, regex) {
		await app.client.waitUntilWindowLoaded();
		const elem = await app.client.$(element);
		const txt = await elem.getText(element);
		return expect(txt).toMatch(regex);
	};

	beforeEach(function () {
		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function (startedApp) {
				app = startedApp;
			});
	});

	afterEach(function () {
		return helpers.stopApplication(app);
	});

	describe("with default 24hr clock config", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_24hr.js";
		});

		it("should show the date in the correct format", async function () {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			return testMatch(".clock .date", dateRegex);
		});

		it("should show the time in 24hr format", async function () {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/;
			return testMatch(".clock .time", timeRegex);
		});
	});

	describe("with default 12hr clock config", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_12hr.js";
		});

		it("should show the date in the correct format", async function () {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			return testMatch(".clock .date", dateRegex);
		});

		it("should show the time in 12hr format", async function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			return testMatch(".clock .time", timeRegex);
		});
	});

	describe("with showPeriodUpper config enabled", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_showPeriodUpper.js";
		});

		it("should show 12hr time with upper case AM/PM", async function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			return testMatch(".clock .time", timeRegex);
		});
	});

	describe("with displaySeconds config disabled", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_displaySeconds_false.js";
		});

		it("should show 12hr time without seconds am/pm", async function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[ap]m$/;
			return testMatch(".clock .time", timeRegex);
		});
	});

	describe("with showWeek config enabled", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_showWeek.js";
		});

		it("should show the week in the correct format", async function () {
			const weekRegex = /^Week [0-9]{1,2}$/;
			return testMatch(".clock .week", weekRegex);
		});

		it("should show the week with the correct number of week of year", async function () {
			const currentWeekNumber = moment().week();
			const weekToShow = "Week " + currentWeekNumber;
			await app.client.waitUntilWindowLoaded();
			const elem = await app.client.$(".clock .week");
			const txt = await elem.getText(".clock .week");
			return expect(txt).toBe(weekToShow);
		});
	});

	describe("with analog clock face enabled", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_analog.js";
		});

		it("should show the analog clock face", async () => {
			await app.client.waitUntilWindowLoaded();
			const clock = await app.client.$$(".clockCircle");
			return expect(clock.length).toBe(1);
		});
	});
});
