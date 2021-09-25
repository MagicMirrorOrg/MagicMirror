const helpers = require("../global-setup");
let app = null;

describe("Alert module", function () {
	beforeAll(function (done) {
		app = helpers.startApplication("tests/configs/modules/alert/default.js");
		helpers.getDocument(done, 1000);
	});
	afterAll(function () {
		helpers.stopApplication(app);
	});

	it("should show the welcome message", function () {
		const elem = document.querySelector(".ns-box .ns-box-inner .light.bright.small");
		expect(elem).not.toBe(null);
		expect(elem.textContent).toContain("Welcome, start was successful!");
	});
});
