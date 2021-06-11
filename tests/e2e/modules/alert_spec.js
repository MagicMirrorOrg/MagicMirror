const helpers = require("../global-setup");

describe("Alert module", function () {
	helpers.setupTimeout(this);

	let app = null;

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

	describe("Default configuration", function () {
		beforeAll(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/alert/default.js";
		});

		it("should show the welcome message", function () {
			return app.client.waitUntilTextExists(".ns-box .ns-box-inner .light.bright.small", "Welcome, start was successful!", 10000);
		});
	});
});
