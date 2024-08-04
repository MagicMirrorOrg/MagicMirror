const os = require("node:os");
const fs = require("node:fs");
const jsdom = require("jsdom");

const indexFile = "index.html";
const cssFile = "css/custom.css";
var indexData = [];
var cssData = [];
const sampleCss = ".region.row3 {  top: 0;}\
.region.row3.left {top: 100%;}";


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
	if (exec) exec;
	global.app = require("../../../js/app");

	return global.app.start();
};

exports.stopApplication = async () => {
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

exports.waitForElement = (selector, ignoreValue = "") => {
	return new Promise((resolve) => {
		let oldVal = "dummy12345";
		const interval = setInterval(() => {
			const element = document.querySelector(selector);
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

exports.fixupIndex = () => {
	cssData = fs.readFileSync(cssFile).toString();
	indexData = fs.readFileSync(indexFile).toString();
	let workIndexLines = indexData.split(os.EOL);
	for (let l in workIndexLines) {
		if (workIndexLines[l].includes("region top right")) {
			workIndexLines.splice(l, 0, "<div class=\"region row3 left\"><div class=\"container\"></div></div>");
			break;
		}
	}
	fs.writeFileSync(indexFile, workIndexLines.join(os.EOL), { flush: true });
	fs.writeFileSync(cssFile, sampleCss, { flush: true });
};

exports.restoreIndex = () => {
	if (indexData.length > 1) {
		fs.writeFileSync(indexFile, indexData, { flush: true });
		fs.writeFileSync(cssFile, cssData, { flush: true });
	}
};
