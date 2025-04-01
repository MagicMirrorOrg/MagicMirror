// see https://playwright.dev/docs/api/class-electronapplication
// https://github.com/microsoft/playwright/issues/6347#issuecomment-1085850728
// https://www.anycodings.com/1questions/958135/can-i-set-the-date-for-playwright-browser
const { _electron: electron } = require("playwright");

exports.startApplication = async (configFilename, systemDate = null, electronParams = [], timezone = "GMT") => {
	global.electronApp = null;
	global.page = null;
	process.env.MM_CONFIG_FILE = configFilename;
	process.env.TZ = timezone;
	if (systemDate) {
		process.env.MOCK_DATE = systemDate;
	}
	process.env.mmTestMode = "true";

	// check environment for DISPLAY or WAYLAND_DISPLAY
	if (process.env.WAYLAND_DISPLAY) {
		electronParams.unshift("js/electron.js", "--enable-features=UseOzonePlatform", "--ozone-platform=wayland");
	} else {
		electronParams.unshift("js/electron.js");
	}

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
						return new Date(systemDate).valueOf();
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
	process.env.MOCK_DATE = undefined;
};

exports.getElement = async (selector, state = "visible") => {
	expect(global.page).not.toBeNull();
	const elem = global.page.locator(selector);
	await elem.waitFor({ state: state });
	expect(elem).not.toBeNull();
	return elem;
};
