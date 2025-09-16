const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const jsdom = require("jsdom");

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
var indexData = [];
var cssData = [];

exports.startApplication = async (configFilename, exec) => {
	jest.resetModules();
	if (global.app) {
		await this.stopApplication();
	}
	// Set config sample for use in test
	if (configFilename === "") {
		process.env.MM_CONFIG_FILE = "config/config.js";
	} else {
		process.env.MM_CONFIG_FILE = configFilename;
	}
	process.env.mmTestMode = "true";
	process.setMaxListeners(0);
	if (exec) exec;
	global.app = require(`${global.root_path}/js/app`);

	return global.app.start();
};

exports.stopApplication = async (waitTime = 10) => {
	if (global.window) {
		// no closing causes jest errors and memory leaks
		global.window.close();
		delete global.window;
		// give above closing some extra time to finish
		await new Promise((resolve) => setTimeout(resolve, waitTime));
	}
	if (!global.app) {
		return Promise.resolve();
	}
	await global.app.stop();
	delete global.app;
};

exports.getDocument = () => {
	return new Promise((resolve) => {
		const url = `http://${config.address || "localhost"}:${config.port || "8080"}`;
		jsdom.JSDOM.fromURL(url, { resources: "usable", runScripts: "dangerously" }).then((dom) => {
			dom.window.name = "jsdom";
			global.window = dom.window;
			// Following fixes `navigator is not defined` errors in e2e tests, found here
			// https://www.appsloveworld.com/reactjs/100/37/mocha-react-navigator-is-not-defined
			global.navigator = {
				useragent: "node.js"
			};
			dom.window.fetch = fetch;
			dom.window.onload = () => {
				global.document = dom.window.document;
				resolve();
			};
		});
	});
};

exports.waitForElement = (selector, ignoreValue = "", timeout = 0) => {
	return new Promise((resolve) => {
		let oldVal = "dummy12345";
		let element = null;
		const interval = setInterval(() => {
			element = document.querySelector(selector);
			if (element) {
				let newVal = element.textContent;
				if (newVal === oldVal) {
					clearInterval(interval);
					resolve(element);
				} else {
					if (ignoreValue === "") {
						oldVal = newVal;
					} else {
						if (!newVal.includes(ignoreValue)) oldVal = newVal;
					}
				}
			}
		}, 100);
		if (timeout !== 0) {
			setTimeout(() => {
				if (interval) clearInterval(interval);
				resolve(null);
			}, timeout);
		}
	});
};

exports.waitForAllElements = (selector) => {
	return new Promise((resolve) => {
		let oldVal = 999999;
		const interval = setInterval(() => {
			const element = document.querySelectorAll(selector);
			if (element) {
				let newVal = element.length;
				if (newVal === oldVal) {
					clearInterval(interval);
					resolve(element);
				} else {
					if (newVal !== 0) oldVal = newVal;
				}
			}
		}, 100);
	});
};

exports.testMatch = async (element, regex) => {
	const elem = await this.waitForElement(element);
	expect(elem).not.toBeNull();
	expect(elem.textContent).toMatch(regex);
	return true;
};

exports.fixupIndex = async () => {
	// read and save the git level index file
	indexData = (await fs.promises.readFile(indexFile)).toString();
	// make lines of the content
	let workIndexLines = indexData.split(os.EOL);
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
	if (indexData.length > 1) {
		//write out saved index.html
		await fs.promises.writeFile(indexFile, indexData, { flush: true });
		// write out saved custom.css
		await fs.promises.writeFile(cssFile, cssData, { flush: true });
	}
};
