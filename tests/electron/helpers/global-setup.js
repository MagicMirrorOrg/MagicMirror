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
		electronParams.unshift("js/electron.js", "--ozone-platform=wayland");
	} else {
		electronParams.unshift("js/electron.js");
	}

	// Pass environment variables to Electron process
	const env = {
		...process.env,
		MM_CONFIG_FILE: configFilename,
		TZ: timezone,
		mmTestMode: "true"
	};
	if (systemDate) {
		env.MOCK_DATE = systemDate;
	}

	global.electronApp = await electron.launch({
		args: electronParams,
		env: env
	});

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

exports.stopApplication = async (timeout = 10000) => {
	const app = global.electronApp;
	global.electronApp = null;
	global.page = null;
	process.env.MOCK_DATE = undefined;

	if (!app) {
		return;
	}

	const killElectron = () => {
		try {
			const electronProcess = typeof app.process === "function" ? app.process() : null;
			if (electronProcess && !electronProcess.killed) {
				electronProcess.kill("SIGKILL");
			}
		} catch (error) {
			// Ignore errors caused by Playwright already tearing down the connection
		}
	};

	try {
		await Promise.race([
			app.close(),
			new Promise((_, reject) => setTimeout(() => reject(new Error("Electron close timeout")), timeout))
		]);
	} catch (error) {
		killElectron();
	}
};

exports.getElement = async (selector, state = "visible") => {
	expect(global.page).not.toBeNull();
	const elem = global.page.locator(selector);
	await elem.waitFor({ state: state });
	expect(elem).not.toBeNull();
	return elem;
};
