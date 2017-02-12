const Application = require("spectron").Application;
const path = require("path");
const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");

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
	this.timeout(20000);

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


		it("if Morning compliments for that part of day", function () {
			var hour = new Date().getHours();
			if (hour >= 3 && hour < 12) {
				// if morning check
				return app.client.waitUntilWindowLoaded()
					.getText(".compliments").then(function (text) {
						expect(text).to.be.oneOf(["Hi", "Good Morning", "Morning test"]);
					})
			}
		});

		it("if Afternoon show Compliments for that part of day", function () {
			var hour = new Date().getHours();
			if (hour >= 12 && hour < 17) {
				// if morning check
				return app.client.waitUntilWindowLoaded()
					.getText(".compliments").then(function (text) {
						expect(text).to.be.oneOf(["Hello", "Good Afternoon", "Afternoon test"]);
					})
			}
		});

		it("if Evening show Compliments for that part of day", function () {
			var hour = new Date().getHours();
			if (!(hour >= 3 && hour < 12) && !(hour >= 12 && hour < 17)) {
				// if evening check
				return app.client.waitUntilWindowLoaded()
					.getText(".compliments").then(function (text) {
						expect(text).to.be.oneOf(["Hello There", "Good Evening", "Evening test"]);
					})
			}
		});

	});

});
