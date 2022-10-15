// see https://playwright.dev/docs/api/class-electronapplication
// https://github.com/microsoft/playwright/issues/6347#issuecomment-1085850728
// https://www.anycodings.com/1questions/958135/can-i-set-the-date-for-playwright-browser
const { _electron: electron } = require("playwright");

exports.startApplication = async (configFilename, systemDate = null, electronParams = ["js/electron.js"]) => {
	global.electronApp = null;
	global.page = null;
	process.env.MM_CONFIG_FILE = configFilename;
	process.env.TZ = "GMT";
	jest.retryTimes(3);
	global.electronApp = await electron.launch({ args: electronParams });
	expect(global.electronApp);

	if ((await global.electronApp.windows().length) === 1) {
		global.page = await global.electronApp.firstWindow();
		if (systemDate) {
			await global.page.evaluate((systemDate) => {
				Date.now = () => {
					return new Date(systemDate);
				};
			}, systemDate);
		}
		expect(await global.page.title()).toBe("MagicMirror²");
		expect(await global.page.isVisible("body")).toBe(true);
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
