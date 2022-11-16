const jsdom = require("jsdom");

exports.startApplication = (configFilename, exec) => {
	jest.resetModules();
	this.stopApplication();
	// Set config sample for use in test
	if (configFilename === "") {
		process.env.MM_CONFIG_FILE = "config/config.js";
	} else {
		process.env.MM_CONFIG_FILE = configFilename;
	}
	if (exec) exec;
	global.app = require("app.js");
	global.app.start();
};

exports.stopApplication = async () => {
	if (global.app) {
		global.app.stop();
	}
	await new Promise((resolve) => setTimeout(resolve, 100));
};

exports.getDocument = (callback) => {
	const url = "http://" + (config.address || "localhost") + ":" + (config.port || "8080");
	jsdom.JSDOM.fromURL(url, { resources: "usable", runScripts: "dangerously" }).then((dom) => {
		dom.window.name = "jsdom";
		dom.window.onload = () => {
			global.document = dom.window.document;
			callback();
		};
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
