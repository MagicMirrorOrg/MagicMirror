const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

describe("Test helloworld module", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("helloworld set config text", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/helloworld/helloworld.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("Test message helloworld module", async () => {
			await expect(page.locator(".helloworld")).toContainText("Test HelloWorld Module");
		});
	});

	describe("helloworld default config text", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/helloworld/helloworld_default.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("Test message helloworld module", async () => {
			await expect(page.locator(".helloworld")).toContainText("Hello World!");
		});
	});
});
