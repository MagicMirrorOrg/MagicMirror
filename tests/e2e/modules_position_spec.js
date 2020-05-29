const helpers = require("./global-setup");

const describe = global.describe;
const it = global.it;

describe("Position of modules", function () {
	helpers.setupTimeout(this);

	var app = null;

	describe("Using helloworld", function () {
		after(function () {
			return helpers.stopApplication(app);
		});

		before(function () {
			// Set config sample for use in test
			process.env.MM_CONFIG_FILE = "tests/configs/modules/positions.js";
			return helpers
				.startApplication({
					args: ["js/electron.js"]
				})
				.then(function (startedApp) {
					app = startedApp;
				});
		});

		var positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third", "middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right", "bottom_bar", "fullscreen_above", "fullscreen_below"];

		var position;
		var className;
		for (var idx in positions) {
			position = positions[idx];
			className = position.replace("_", ".");
			it("show text in " + position, function () {
				return app.client
					.waitUntilWindowLoaded()
					.getText("." + className)
					.should.eventually.equal("Text in " + position);
			});
		}
	});
});
