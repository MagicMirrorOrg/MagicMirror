const helpers = require("../global-setup");
const path = require("path");
const request = require("request");

const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe("Newsfeed module", function() {
	helpers.setupTimeout(this);

	var app = null;

	beforeEach(function() {
		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function(startedApp) {
				app = startedApp;
			});
	});

	afterEach(function() {
		return helpers.stopApplication(app);
	});

	describe("Default configuration", function() {
		before(function() {
			process.env.MM_CONFIG_FILE = "tests/configs/modules/newsfeed/default.js";
		});

		it("show title newsfeed", function() {
			return app.client.waitUntilTextExists(".newsfeed .small", "Rodrigo Ramirez Blog", 10000).should.be.fulfilled;
		});
	});
});
