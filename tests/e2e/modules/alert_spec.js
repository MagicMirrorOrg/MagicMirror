const helpers = require("../helpers/global-setup");

describe("Alert module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("with welcome_message set to false", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/alert/welcome_false.js");
			await helpers.getDocument();
		});

		it("should not show any welcome message", async () => {
			// Wait a bit to ensure no message appears
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Check that no alert/notification elements are present
			const alertElements = document.querySelectorAll(".ns-box .ns-box-inner .light.bright.small");
			expect(alertElements).toHaveLength(0);
		});
	});

	describe("with welcome_message set to true", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/alert/welcome_true.js");
			await helpers.getDocument();

			// Wait for the application to initialize
			await new Promise((resolve) => setTimeout(resolve, 1000));
		});

		it("should show the translated welcome message", async () => {
			const elem = await helpers.waitForElement(".ns-box .ns-box-inner .light.bright.small");
			expect(elem).not.toBeNull();
			expect(elem.textContent).toContain("Welcome, start was successful!");
		});
	});

	describe("with welcome_message set to custom string", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/modules/alert/welcome_string.js");
			await helpers.getDocument();
		});

		it("should show the custom welcome message", async () => {
			const elem = await helpers.waitForElement(".ns-box .ns-box-inner .light.bright.small");
			expect(elem).not.toBeNull();
			expect(elem.textContent).toContain("Custom welcome message!");
		});
	});
});
