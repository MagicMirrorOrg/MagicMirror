const Application = require("spectron").Application;
const path = require("path");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");

var electronPath = path.join(__dirname, "../../", "node_modules", ".bin", "electron");

if (process.platform === "win32") {
	electronPath += ".cmd";
}

var appPath = path.join(__dirname, "../../js/electron.js");

var app = new Application({
	path: electronPath
});

global.before(function () {
	chai.should();
	chai.use(chaiAsPromised);
});

describe("Argument 'dev'", function () {
	this.timeout(20000);

	before(function() {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});

	it("should not open dev console when absent", function () {
		app.args = [appPath];

		return app.start().then(function() {
			return expect(app.browserWindow.isDevToolsOpened()).to.eventually.equal(false);
		});
	});

	it("should open dev console when provided", function () {
		app.args = [appPath, "dev"];

		return app.start().then(function() {
			return expect(app.browserWindow.isDevToolsOpened()).to.eventually.equal(true);
		});
	});
});
