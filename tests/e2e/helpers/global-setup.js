const jsdom = require("jsdom");

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
