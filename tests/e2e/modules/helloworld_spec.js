const helpers = require("../global-setup");
const path = require("path");
const request = require("request");

const expect = require("chai").expect;

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe("Test helloworld module", function() {
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

	describe("helloworld set config text", function () {
		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/helloworld/helloworld.js";
		});

		it("Test message helloworld module", function () {
			return app.client.waitUntilWindowLoaded()
				.getText(".helloworld").should.eventually.equal("Test HelloWorld Module");
		});
	});

	describe("helloworld default config text", function () {
		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/helloworld/helloworld_default.js";
		});

		it("Test message helloworld module", function () {
			return app.client.waitUntilWindowLoaded()
				.getText(".helloworld").should.eventually.equal("Hello World!");
		});
	});

});
