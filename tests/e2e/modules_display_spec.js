const helpers = require("./helpers/global-setup");

describe("Display of modules", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/modules/display.js");
		await helpers.getDocument();
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("should show the test header", async () => {
		const elem = await helpers.waitForElement("#module_0_helloworld .module-header");
		expect(elem).not.toBeNull();
		// textContent returns lowercase here, the uppercase is realized by CSS, which therefore does not end up in textContent
		expect(elem.textContent).toBe("test_header");
	});

	it("should show no header if no header text is specified", async () => {
		const elem = await helpers.waitForElement("#module_1_helloworld .module-header");
		expect(elem).not.toBeNull();
		expect(elem.textContent).toBe("undefined");
	});
});
