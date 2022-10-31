// see https://playwright.dev/docs/api/class-electronapplication
// https://github.com/microsoft/playwright/issues/6347#issuecomment-1085850728
// https://www.anycodings.com/1questions/958135/can-i-set-the-date-for-playwright-browser
const { _electron: electron } = require("playwright");

exports.startApplication = async (configFilename, electronParams = ["js/electron.js"]) => {
	global.electronApp = null;
	global.page = null;
	process.env.MM_CONFIG_FILE = configFilename;
	process.env.TZ = "GMT";
	jest.retryTimes(3);
	global.electronApp = await electron.launch({ args: electronParams });

	//We only need the first window for the majority of the tests
	global.page = await global.electronApp.firstWindow();

	//Wait for the body element to be visible
	await global.page.waitForSelector("body");
};

exports.stopApplication = async () => {
	if (global.electronApp) {
		await global.electronApp.close();
	}
	global.electronApp = null;
	global.page = null;
};

exports.getElement = async (selector) => {
	expect(global.page).not.toBe(null);
	let elem = global.page.locator(selector);
	await elem.waitFor();
	expect(elem).not.toBe(null);
	return elem;
};

exports.mockSystemDate = async (systemDate) => {
	await global.page.evaluate((systemDate) => {
		Date.now = () => {
			return new Date(systemDate);
		};
	}, systemDate);
};
