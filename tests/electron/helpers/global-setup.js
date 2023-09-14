// see https://playwright.dev/docs/api/class-electronapplication
// https://github.com/microsoft/playwright/issues/6347#issuecomment-1085850728
// https://www.anycodings.com/1questions/958135/can-i-set-the-date-for-playwright-browser
const { _electron: electron } = require("playwright");

exports.startApplication = async (configFilename, systemDate = null, electronParams = ["js/electron.js"]) => {
	global.electronApp = null;
	global.page = null;
	process.env.MM_CONFIG_FILE = configFilename;
	process.env.TZ = "GMT";
	global.electronApp = await electron.launch({ args: electronParams });

	await global.electronApp.firstWindow();

	for (const win of global.electronApp.windows()) {
		const title = await win.title();
		expect(["MagicMirror²", "DevTools"]).toContain(title);
		if (title === "MagicMirror²") {
			global.page = win;
			if (systemDate) {
				await global.page.evaluate((systemDate) => {
					Date.now = () => {
						return new Date(systemDate);
					};
				}, systemDate);
			}
		}
	}
};

exports.stopApplication = async () => {
	if (global.electronApp) {
		await global.electronApp.close();
	}
	global.electronApp = null;
	global.page = null;
};

exports.getElement = async (selector) => {
	expect(global.page);
	let elem = global.page.locator(selector);
	await elem.waitFor();
	expect(elem).not.toBe(null);
	return elem;
};
