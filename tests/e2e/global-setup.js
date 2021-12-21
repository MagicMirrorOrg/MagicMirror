const jsdom = require("jsdom");

exports.startApplication = function (configFilename, exec) {
	jest.resetModules();
	if (global.app) {
		global.app.stop();
	}
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

exports.stopApplication = function () {
	if (global.app) {
		global.app.stop();
	}
};

exports.getDocument = function (callback, ms) {
	const url = "http://" + (config.address || "localhost") + ":" + (config.port || "8080");
	jsdom.JSDOM.fromURL(url, { resources: "usable", runScripts: "dangerously" }).then((dom) => {
		dom.window.name = "jsdom";
		dom.window.onload = function () {
			global.document = dom.window.document;
			setTimeout(() => {
				callback();
			}, ms);
		};
	});
};
