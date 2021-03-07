const helpers = require("../global-setup");
const expect = require("chai").expect;
const moment = require("moment");

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe("Clock module", function () {
	helpers.setupTimeout(this);

	var app = null;

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
		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_24hr.js";
		});

		it("should show the date in the correct format", async function () {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			const elem = await app.client.$(".clock .date");
			return elem.getText(".clock .date").should.eventually.match(dateRegex);
		});

		it("should show the time in 24hr format", async function () {
			const timeRegex = /^(?:2[0-3]|[01]\d):[0-5]\d[0-5]\d$/;
			const elem = await app.client.$(".clock .time");
			return elem.getText(".clock .time").should.eventually.match(timeRegex);
		});
	});

	describe("with default 12hr clock config", function () {
		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_12hr.js";
		});

		it("should show the date in the correct format", async function () {
			const dateRegex = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;
			const elem = await app.client.$(".clock .date");
			return elem.getText(".clock .date").should.eventually.match(dateRegex);
		});

		it("should show the time in 12hr format", async function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[ap]m$/;
			const elem = await app.client.$(".clock .time");
			return elem.getText(".clock .time").should.eventually.match(timeRegex);
		});
	});

	describe("with showPeriodUpper config enabled", function () {
		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_showPeriodUpper.js";
		});

		it("should show 12hr time with upper case AM/PM", async function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[0-5]\d[AP]M$/;
			const elem = await app.client.$(".clock .time");
			return elem.getText(".clock .time").should.eventually.match(timeRegex);
		});
	});

	describe("with displaySeconds config disabled", function () {
		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_displaySeconds_false.js";
		});

		it("should show 12hr time without seconds am/pm", async function () {
			const timeRegex = /^(?:1[0-2]|[1-9]):[0-5]\d[ap]m$/;
			const elem = await app.client.$(".clock .time");
			return elem.getText(".clock .time").should.eventually.match(timeRegex);
		});
	});

	describe("with showWeek config enabled", function () {
		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_showWeek.js";
		});

		it("should show the week in the correct format", async function () {
			const weekRegex = /^Week [0-9]{1,2}$/;
			const elem = await app.client.$(".clock .week");
			return elem.getText(".clock .week").should.eventually.match(weekRegex);
		});

		it("should show the week with the correct number of week of year", async function () {
			const currentWeekNumber = moment().week();
			const weekToShow = "Week " + currentWeekNumber;
			const elem = await app.client.$(".clock .week");
			return elem.getText(".clock .week").should.eventually.equal(weekToShow);
		});
	});

	describe("with analog clock face enabled", function () {
		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/clock/clock_analog.js";
		});

		it("should show the analog clock face", async () => {
			await app.client.waitUntilWindowLoaded(10000);
			const clock = await app.client.$$(".clockCircle");
			return expect(clock.length).equals(1);
		});
	});
});
