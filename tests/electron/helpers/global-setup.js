// see https://playwright.dev/docs/api/class-electronapplication
// https://github.com/microsoft/playwright/issues/6347#issuecomment-1085850728
// https://www.anycodings.com/1questions/958135/can-i-set-the-date-for-playwright-browser
const { _electron: electron } = require("playwright");

function applyMocks(page) {
	if (global.mocks) {
		for (let mock of global.mocks) {
			mock(page);
		}
	}
}

exports.startApplication = async (configFilename, electronParams = ["js/electron.js"]) => {
	await this.stopApplication();
	process.env.MM_CONFIG_FILE = configFilename;
	process.env.TZ = "GMT";
	global.electronApp = await electron.launch({ args: electronParams });

	//Make sure new open windows gets mocked too
	global.electronApp.on("window", applyMocks);

	//Apply mocks for all existing pages
	for (let page of global.electronApp.windows()) {
		applyMocks(page);
	}

	//We only need the first window for the majority of the tests
	global.page = await global.electronApp.firstWindow();

	//Wait for the body element to be visible
	await global.page.waitForSelector("body");
};

exports.stopApplication = async () => {
	if (global.electronApp) {
		await global.electronApp.close();
		global.electronApp = null;
		global.page = null;
		global.mocks = null;
	}
};

exports.getElement = async (selector) => {
	expect(global.page).not.toBe(null);
	let elem = global.page.locator(selector);
	await elem.waitFor();
	expect(elem).not.toBe(null);
	return elem;
};

exports.mockSystemDate = (mockedSystemDate) => {
	if (!global.mocks) {
		global.mocks = [];
	}

	global.mocks.push(async (page) => {
		await page.evaluate((systemDate) => {
			Date.now = () => {
				return new Date(systemDate);
			};
		}, mockedSystemDate);
	});
};
