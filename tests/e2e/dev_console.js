const helpers = require("./global-setup");

describe("Development console tests", function () {
	helpers.setupTimeout(this);

	let app = null;

	beforeAll(function () {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";
	});

	describe("Without 'dev' commandline argument", function () {
		beforeAll(function () {
			return helpers
				.startApplication({
					args: ["js/electron.js"]
				})
				.then(function (startedApp) {
					app = startedApp;
				});
		});

		afterAll(function () {
			return helpers.stopApplication(app);
		});

		it("should not open dev console when absent", async function () {
			await app.client.waitUntilWindowLoaded();
			return expect(await app.browserWindow.isDevToolsOpened()).toBe(false);
		});
	});

	describe("With 'dev' commandline argument", function () {
		beforeAll(function () {
			return helpers
				.startApplication({
					args: ["js/electron.js", "dev"]
				})
				.then(function (startedApp) {
					app = startedApp;
				});
		});

		afterAll(function () {
			return helpers.stopApplication(app);
		});

		it("should open dev console when provided", async function () {
			expect(await app.client.getWindowCount()).toBe(2);
		});
	});
});
