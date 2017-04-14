const globalSetup = require("./global-setup");
const app = globalSetup.app;
const chai = require("chai");
const expect = chai.expect;

describe("Position of modules", function () {
	this.timeout(20000);


	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});


	describe("Using helloworld", function() {

		before(function() {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/positions.js";
		});

		var positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third",
			"middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right",
			"bottom_bar", "fullscreen_above", "fullscreen_below"];

		var position;
		var className;
		for (idx in positions) {
			position = positions[idx];
			className = position.replace("_", ".");
			it("show text in " + position , function () {
				return app.client.waitUntilWindowLoaded()
					.getText("." + className).should.eventually.equal("Text in " + position);
			});
		}
	});

});
