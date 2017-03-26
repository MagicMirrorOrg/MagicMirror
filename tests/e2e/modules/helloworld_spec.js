const globalSetup = require("../global-setup");
const app = globalSetup.app;

describe("Test helloworld module", function () {
	this.timeout(20000);


	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
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
