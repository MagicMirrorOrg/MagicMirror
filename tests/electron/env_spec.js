const helpers = require("./helpers/global-setup");

describe("Electron app environment", () => {
	beforeEach(async () => {
		await helpers.startApplication("tests/configs/modules/display.js");
	});

	afterEach(async () => {
		await helpers.stopApplication();
	});

	it("should open browserwindow", async () => {
		const module = await helpers.getElement("#module_0_helloworld");
		expect(await module.textContent()).toContain("Test Display Header");
		expect(await global.electronApp.windows().length).toBe(1);
	});
});

describe("Development console tests", () => {
	beforeEach(async () => {
		await helpers.startApplication("tests/configs/modules/display.js", ["js/electron.js", "dev"]);
	});

	afterEach(async () => {
		await helpers.stopApplication();
	});

	it("should open browserwindow and dev console", async () => {
		while (global.electronApp.windows().length < 2) {
			await global.electronApp.waitForEvent("window");
		}

		for (let page of global.electronApp.windows()) {
			expect(["MagicMirror²", "DevTools"]).toContain(await page.title());
		}
	});
});
