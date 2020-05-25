const helpers = require("./global-setup");
const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;

describe("Development console tests", function () {
	// FIXME: This tests fail and crash another tests
	// Suspect problem with window focus
	return false;

	/* eslint-disable */
	helpers.setupTimeout(this);

	var app = null;

	before(function () {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";
	});

	describe("Without 'dev' commandline argument", function () {
		before(function () {
			return helpers
				.startApplication({
					args: ["js/electron.js"]
				})
				.then(function (startedApp) {
					app = startedApp;
				});
		});

		after(function () {
			return helpers.stopApplication(app);
		});

		it("should not open dev console when absent", function () {
			return expect(app.browserWindow.isDevToolsOpened()).to.eventually.equal(false);
		});
	});

	describe("With 'dev' commandline argument", function () {
		before(function () {
			return helpers
				.startApplication({
					args: ["js/electron.js", "dev"]
				})
				.then(function (startedApp) {
					app = startedApp;
				});
		});

		after(function () {
			return helpers.stopApplication(app);
		});

		it("should open dev console when provided", function () {
			return expect(app.browserWindow.isDevToolsOpened()).to.eventually.equal(true);
		});
	});
	/* eslint-enable */
});
