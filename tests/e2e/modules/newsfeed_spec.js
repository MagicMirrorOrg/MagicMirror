const helpers = require("../global-setup");

describe("Newsfeed module", function () {
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
			process.env.MM_CONFIG_FILE = "tests/configs/modules/newsfeed/default.js";
		});

		it("should show the newsfeed title", function () {
			return app.client.waitUntilTextExists(".newsfeed .newsfeed-source", "Rodrigo Ramirez Blog", 10000);
		});

		it("should show the newsfeed article", function () {
			return app.client.waitUntilTextExists(".newsfeed .newsfeed-title", "QPanel", 10000);
		});

		it("should NOT show the newsfeed description", async () => {
			await app.client.waitUntilTextExists(".newsfeed .newsfeed-title", "QPanel", 10000);
			const events = await app.client.$$(".newsfeed .newsfeed-desc");
			return expect(events.length).toBe(0);
		});
	});

	describe("Custom configuration", function () {
		beforeAll(function () {
			process.env.MM_CONFIG_FILE = "tests/configs/modules/newsfeed/prohibited_words.js";
		});

		it("should not show articles with prohibited words", function () {
			return app.client.waitUntilTextExists(".newsfeed .newsfeed-title", "Problema VirtualBox", 10000);
		});

		it("should show the newsfeed description", async () => {
			await app.client.waitUntilTextExists(".newsfeed .newsfeed-title", "Problema VirtualBox", 10000);
			const events = await app.client.$$(".newsfeed .newsfeed-desc");
			return expect(events.length).toBe(1);
		});
	});

	describe("Invalid configuration", function () {
		beforeAll(function () {
			process.env.MM_CONFIG_FILE = "tests/configs/modules/newsfeed/incorrect_url.js";
		});

		it("should show malformed url warning", function () {
			return app.client.waitUntilTextExists(".newsfeed .small", "Error in the Newsfeed module. Malformed url.", 10000);
		});
	});
});
