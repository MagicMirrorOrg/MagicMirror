const globalSetup = require("../global-setup");
const app = globalSetup.app;
const chai = require("chai");
const expect = chai.expect;

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
