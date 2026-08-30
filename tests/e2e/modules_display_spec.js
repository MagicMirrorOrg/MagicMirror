const { expect } = require("playwright/test");
const helpers = require("./helpers/global-setup");

describe("Display of modules", () => {
	let page;

	beforeAll(async () => {
		await helpers.startApplication("tests/configs/modules/display.js");
		await helpers.getDocument();
		page = helpers.getPage();
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("should show the test header", async () => {
		// textContent returns lowercase here, the uppercase is realized by CSS, which therefore does not end up in textContent
		await expect(page.locator("#module_0_helloworld .module-header")).toHaveText("test_header");
	});

	it("should show no header if no header text is specified", async () => {
		await expect(page.locator("#module_1_helloworld .module-header")).toHaveText("undefined");
	});
});
