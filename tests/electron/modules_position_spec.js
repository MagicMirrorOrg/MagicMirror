const helpers = require("./global-setup");

describe("Position of modules", function () {
	helpers.setupTimeout(this);

	let app = null;

	describe("Using helloworld", function () {
		afterAll(function () {
			return helpers.stopApplication(app);
		});

		beforeAll(function () {
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

		const positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third", "middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right", "bottom_bar", "fullscreen_above", "fullscreen_below"];

		for (const position of positions) {
			const className = position.replace("_", ".");
			it("should show text in " + position, function () {
				return app.client.$("." + className).then((result) => {
					return result.getText("." + className).then((text) => {
						return expect(text).toContain("Text in " + position);
					});
				});
			});
		}
	});
});
