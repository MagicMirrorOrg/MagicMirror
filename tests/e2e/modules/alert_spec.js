const helpers = require("../helpers/global-setup");

describe("Alert module", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/modules/alert/default.js");
		await helpers.getDocument();
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("should show the welcome message", async () => {
		const elem = await helpers.waitForElement(".ns-box .ns-box-inner .light.bright.small");
		expect(elem).not.toBeNull();
		expect(elem.textContent).toContain("Welcome, start was successful!");
	});
});
