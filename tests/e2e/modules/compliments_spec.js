const Application = require("spectron").Application;
const path = require("path");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const moment = require("../../../vendor/moment/moment-with-locales.js");

var electronPath = path.join(__dirname, "../../../", "node_modules", ".bin", "electron");

if (process.platform === "win32") {
	electronPath += ".cmd";
}

var appPath = path.join(__dirname, "../../../js/electron.js");

var app = new Application({
	path: electronPath,
	args: [appPath]
});

global.before(function () {
	chai.should();
	chai.use(chaiAsPromised);
});

describe("Compliments module", function () {
	this.timeout(10000);

	describe("parts of days", function() {
		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/compliments/compliments_parts_day.js";
		});

		beforeEach(function (done) {
			app.start().then(function() { done(); } );
		});

		afterEach(function (done) {
			app.stop().then(function() { done(); });
		});

		it("shows correct compliments for part of day", function () {

			var hour = moment().hour();
			if (hour >= 3 && hour < 12) {
				compliment = "Morning test";
			} else if (hour >= 12 && hour < 17) {
				compliment = "Afternoon test";
			} else {
				compliment = "Evening test";
			}

			return app.client.waitUntilWindowLoaded()
				.getText(".compliments").should.eventually.equal(compliment);
		});
	});

});
