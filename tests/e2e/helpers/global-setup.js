const jsdom = require("jsdom");
const corefetch = require("fetch");

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
			dom.window.fetch = corefetch;
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

exports.fetch = (url) => {
	return new Promise((resolve) => {
		corefetch(url).then((res) => {
			resolve(res);
		});
	});
};

exports.testMatch = async (element, regex) => {
	const elem = await this.waitForElement(element);
	expect(elem).not.toBe(null);
	expect(elem.textContent).toMatch(regex);
};
