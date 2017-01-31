const Application = require("spectron").Application;
const path = require("path");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

var electronPath = path.join(__dirname, "../../", "node_modules", ".bin", "electron");

if (process.platform === "win32") {
	electronPath += ".cmd";
}

var appPath = path.join(__dirname, "../../js/electron.js");

var app = new Application({
	path: electronPath,
	args: [appPath]
});

global.before(function () {
	chai.should();
	chai.use(chaiAsPromised);
});

describe("Electron app environment", function () {
	this.timeout(10000);

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
