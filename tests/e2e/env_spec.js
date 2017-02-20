const globalSetup = require("./global-setup");
const app = globalSetup.app;

describe("Electron app environment", function () {
	this.timeout(20000);

	before(function() {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";
	});

	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});


	it("is set to open new app window", function () {
		return app.client.waitUntilWindowLoaded()
			.getWindowCount().should.eventually.equal(1);
	});

	it("sets correct window title", function () {
		return app.client.waitUntilWindowLoaded()
			.getTitle().should.eventually.equal("Magic Mirror");
	});

});
