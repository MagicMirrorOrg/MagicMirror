const helpers = require("../global-setup");

describe("Alert module", () => {
	beforeAll((done) => {
		helpers.startApplication("tests/configs/modules/alert/default.js");
		helpers.getDocument(done);
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("should show the welcome message", (done) => {
		helpers.waitForElement(".ns-box .ns-box-inner .light.bright.small").then((elem) => {
			done();
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain("Welcome, start was successful!");
		});
	});
});
