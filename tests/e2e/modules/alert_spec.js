const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

describe("Alert module", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("with welcome_message set to false", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/alert/welcome_false.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should not show any welcome message", async () => {
			// Wait a bit to ensure no message appears
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Check that no alert/notification elements are present
			await expect(page.locator(".ns-box .ns-box-inner .light.bright.small")).toHaveCount(0);
		});
	});

	describe("with welcome_message set to true", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/alert/welcome_true.js");
			await helpers.getDocument();
			page = helpers.getPage();

			// Wait for the application to initialize
			await new Promise((resolve) => setTimeout(resolve, 1000));
		});

		it("should show the translated welcome message", async () => {
			await expect(page.locator(".ns-box .ns-box-inner .light.bright.small")).toContainText("Welcome, start was successful!");
		});
	});

	describe("with welcome_message set to custom string", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/alert/welcome_string.js");
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should show the custom welcome message", async () => {
			await expect(page.locator(".ns-box .ns-box-inner .light.bright.small")).toContainText("Custom welcome message!");
		});
	});
});
