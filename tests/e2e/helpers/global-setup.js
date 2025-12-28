const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const { chromium } = require("playwright");

// global absolute root path
global.root_path = path.resolve(`${__dirname}/../../../`);

const indexFile = `${global.root_path}/index.html`;
const cssFile = `${global.root_path}/css/custom.css`;
const sampleCss = [
	".region.row3 {",
	" top: 0;",
	"}",
	".region.row3.left {",
	" top: 100%;",
	"}"
];
let indexData = "";
let cssData = "";

let browser;
let context;
let page;

/**
 * Ensure Playwright browser and context are available.
 * @returns {Promise<void>}
 */
async function ensureContext () {
	if (!browser) {
		// Additional args for CI stability to prevent crashes
		const launchOptions = {
			headless: true,
			args: [
				"--disable-dev-shm-usage", // Overcome limited resource problems in Docker/CI
				"--disable-gpu", // Disable GPU hardware acceleration
				"--no-sandbox", // Required for running as root in some CI environments
				"--disable-setuid-sandbox",
				"--single-process" // Run in single process mode for better stability in CI
			]
		};
		browser = await chromium.launch(launchOptions);
	}
	if (!context) {
		context = await browser.newContext();
	}
}

/**
 * Open a fresh page pointing to the provided url.
 * @param {string} url target url
 * @returns {Promise<import('playwright').Page>} initialized page instance
 */
async function openPage (url) {
	await ensureContext();
	if (page) {
		await page.close();
	}
	page = await context.newPage();
	await page.goto(url, { waitUntil: "load" });
	return page;
}

/**
 * Close page, context and browser if they exist.
 * @returns {Promise<void>}
 */
async function closeBrowser () {
	if (page) {
		await page.close();
		page = null;
	}
	if (context) {
		await context.close();
		context = null;
	}
	if (browser) {
		await browser.close();
		browser = null;
	}
}

exports.getPage = () => {
	if (!page) {
		throw new Error("Playwright page is not initialized. Call getDocument() first.");
	}
	return page;
};


exports.startApplication = async (configFilename, exec) => {
	vi.resetModules();

	// Clear Node's require cache for config and app files to prevent stale configs and middlewares
	Object.keys(require.cache).forEach((key) => {
		if (
			key.includes("/tests/configs/")
			|| key.includes("/config/config")
			|| key.includes("/js/app.js")
			|| key.includes("/js/server.js")
		) {
			delete require.cache[key];
		}
	});

	if (global.app) {
		await exports.stopApplication();
	}

	// Use fixed port 8080 (tests run sequentially, no conflicts)
	const port = 8080;
	global.testPort = port;

	// Set config sample for use in test
	let configPath;
	if (configFilename === "") {
		configPath = "config/config.js";
	} else {
		configPath = configFilename;
	}

	process.env.MM_CONFIG_FILE = configPath;

	// Override port in config - MUST be set before app loads
	process.env.MM_PORT = port.toString();

	process.env.mmTestMode = "true";
	process.setMaxListeners(0);
	if (exec) exec;
	global.app = require(`${global.root_path}/js/app`);

	return global.app.start();
};

exports.stopApplication = async (waitTime = 100) => {
	await closeBrowser();

	if (!global.app) {
		delete global.testPort;
		return Promise.resolve();
	}

	await global.app.stop();
	delete global.app;
	delete global.testPort;

	// Wait for any pending async operations to complete before closing DOM
	await new Promise((resolve) => setTimeout(resolve, waitTime));
};

exports.getDocument = async () => {
	const port = global.testPort || config.port || 8080;
	const address = config.address === "0.0.0.0" ? "localhost" : config.address || "localhost";
	const url = `http://${address}:${port}`;

	await openPage(url);
};

exports.fixupIndex = async () => {
	// read and save the git level index file
	indexData = (await fs.promises.readFile(indexFile)).toString();
	// make lines of the content
	const workIndexLines = indexData.split(os.EOL);
	// loop thru the lines to find place to insert new region
	for (let l in workIndexLines) {
		if (workIndexLines[l].includes("region top right")) {
			// insert a new line with new region definition
			workIndexLines.splice(l, 0, "      <div class=\"region row3 left\"><div class=\"container\"></div></div>");
			break;
		}
	}
	// write out the new index.html file, not append
	await fs.promises.writeFile(indexFile, workIndexLines.join(os.EOL), { flush: true });
	// read in the current custom.css
	cssData = (await fs.promises.readFile(cssFile)).toString();
	// write out the custom.css for this testcase, matching the new region name
	await fs.promises.writeFile(cssFile, sampleCss.join(os.EOL), { flush: true });
};

exports.restoreIndex = async () => {
	// if we read in data
	if (indexData.length > 0) {
		//write out saved index.html
		await fs.promises.writeFile(indexFile, indexData, { flush: true });
		// write out saved custom.css
		await fs.promises.writeFile(cssFile, cssData, { flush: true });
	}
};
