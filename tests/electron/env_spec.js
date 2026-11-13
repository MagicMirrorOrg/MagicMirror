const events = require("node:events");
const helpers = require("./helpers/global-setup");

describe("Electron app environment", () => {
	beforeEach(async () => {
		await helpers.startApplication("tests/configs/modules/display.js");
	});

	afterEach(async () => {
		await helpers.stopApplication();
	});

	it("should open browserwindow", async () => {
		// Wait for module content to be rendered, not just the module wrapper
		const moduleContent = await helpers.getElement("#module_0_helloworld .module-content");
		await expect(moduleContent.textContent()).resolves.toContain("Test Display Header");
		expect(global.electronApp.windows()).toHaveLength(1);
		const windowState = await global.electronApp.evaluate(({ BrowserWindow }) => {
			const [window] = BrowserWindow.getAllWindows();
			return { visible: window.isVisible(), fullscreen: window.isFullScreen(), bounds: window.getBounds() };
		});
		expect(windowState.visible).toBe(false);
		expect(windowState.fullscreen).toBe(false);
		expect(windowState.bounds).toMatchObject({ width: 640, height: 480 });
	});
});

describe("Development console tests", () => {
	beforeEach(async () => {
		await helpers.startApplication("tests/configs/modules/display.js", null, ["dev"]);
	});

	afterEach(async () => {
		await helpers.stopApplication();
	});

	it("should open browserwindow and dev console", async () => {
		while (global.electronApp.windows().length < 2) await events.once(global.electronApp, "window");
		const pageArray = await global.electronApp.windows();
		expect(pageArray).toHaveLength(2);
		for (const page of pageArray) {
			expect(["MagicMirror²", "DevTools"]).toContain(await page.title());
		}
		const visible = await global.electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().some((window) => window.isVisible()));
		expect(visible).toBe(false);
	});
});
