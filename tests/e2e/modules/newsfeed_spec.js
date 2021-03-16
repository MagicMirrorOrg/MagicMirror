const helpers = require("../global-setup");

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

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
		before(function () {
			process.env.MM_CONFIG_FILE = "tests/configs/modules/newsfeed/default.js";
		});

		it("should show the newsfeed title", function () {
			return app.client.waitUntilTextExists(".newsfeed .newsfeed-source", "Rodrigo Ramirez Blog", 10000);
		});

		it("should show the newsfeed article", function () {
			return app.client.waitUntilTextExists(".newsfeed .newsfeed-title", "QPanel", 10000);
		});
	});

	describe("Custom configuration", function () {
		before(function () {
			process.env.MM_CONFIG_FILE = "tests/configs/modules/newsfeed/prohibited_words.js";
		});

		it("should not show articles with prohibited words", function () {
			return app.client.waitUntilTextExists(".newsfeed .newsfeed-title", "Problema VirtualBox", 10000);
		});
	});

	describe("Invalid configuration", function () {
		before(function () {
			process.env.MM_CONFIG_FILE = "tests/configs/modules/newsfeed/incorrect_url.js";
		});

		it("should show invalid url warning", function () {
			return app.client.waitUntilTextExists(".newsfeed .small", "Error in the Newsfeed module. Incorrect url:", 10000);
		});
	});
});
