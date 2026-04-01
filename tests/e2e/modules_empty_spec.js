const { expect } = require("playwright/test");
const helpers = require("./helpers/global-setup");

describe("Check configuration without modules", () => {
	let page;

	beforeAll(async () => {
		await helpers.startApplication("tests/configs/without_modules.js");
		await helpers.getDocument();
		page = helpers.getPage();
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("shows the message MagicMirror² title", async () => {
		await expect(page.locator("#module_1_helloworld .module-content")).toContainText("MagicMirror²");
	});

	it("shows the project URL", async () => {
		await expect(page.locator("#module_5_helloworld .module-content")).toContainText("https://magicmirror.builders/");
	});
});
