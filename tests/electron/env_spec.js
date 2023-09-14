const events = require("events");
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
		expect(global.electronApp.windows().length).toBe(1);
	});
});

describe("Development console tests", () => {
	beforeEach(async () => {
		await helpers.startApplication("tests/configs/modules/display.js", null, ["js/electron.js", "dev"]);
	});

	afterEach(async () => {
		await helpers.stopApplication();
	});

	it("should open browserwindow and dev console", async () => {
		while (global.electronApp.windows().length < 2) await events.once(global.electronApp, "window");
		const pageArray = await global.electronApp.windows();
		expect(pageArray.length).toBe(2);
		for (const page of pageArray) {
			expect(["MagicMirror²", "DevTools"]).toContain(await page.title());
		}
	});
});
