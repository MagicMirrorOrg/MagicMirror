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



describe("Check configuration without modules", function () {
	this.timeout(20000);

	before(function() {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/without_modules.js";
	});

	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});

	it("Show the message MagicMirror title", function () {
		return app.client.waitUntilWindowLoaded()
			.getText("#module_1_helloworld .module-content").should.eventually.equal("Magic Mirror2")
	});

	it("Show the text Michael's website", function () {
		return app.client.waitUntilWindowLoaded()
			.getText("#module_5_helloworld .module-content").should.eventually.equal("www.michaelteeuw.nl");
	});

});

