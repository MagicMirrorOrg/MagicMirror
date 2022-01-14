const helpers = require("./global-setup");

describe("Position of modules", function () {
	beforeAll(function (done) {
		helpers.startApplication("tests/configs/modules/positions.js");
		helpers.getDocument(done);
	});
	afterAll(function () {
		helpers.stopApplication();
	});

	const positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third", "middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right", "bottom_bar", "fullscreen_above", "fullscreen_below"];

	for (const position of positions) {
		const className = position.replace("_", ".");
		it("should show text in " + position, function () {
			helpers.waitForElement("." + className).then((elem) => {
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Text in " + position);
			});
		});
	}
});
