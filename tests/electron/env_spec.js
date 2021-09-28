const helpers = require("./global-setup");

describe("Electron app environment", function () {
	helpers.setupTimeout(this);

	let app = null;

	beforeAll(function () {
		// Set config sample for use in test
		process.env.MM_CONFIG_FILE = "tests/configs/env.js";
	});

	beforeEach(function () {
		return helpers
			.startApplication({
				args: ["js/electron.js"]
			})
			.then(function (startedApp) {
				app = startedApp;
			});
	});

	afterEach(function () {
		return helpers.stopApplication(app);
	});

	it("should open a browserwindow", async function () {
		await app.client.waitUntilWindowLoaded();
		app.browserWindow.focus();
		expect(await app.client.getWindowCount()).toBe(1);
		expect(await app.browserWindow.isMinimized()).toBe(false);
		expect(await app.browserWindow.isDevToolsOpened()).toBe(false);
		expect(await app.browserWindow.isVisible()).toBe(true);
		expect(await app.browserWindow.isFocused()).toBe(true);
		const bounds = await app.browserWindow.getBounds();
		expect(bounds.width).toBeGreaterThan(0);
		expect(bounds.height).toBeGreaterThan(0);
		expect(await app.browserWindow.getTitle()).toBe("MagicMirror²");
	});
});
