const jsdom = require("jsdom");
const config = require("../configs/empty_ipWhiteList");

exports.startApplication = function (configFilename, exec) {
	jest.resetModules();
	let app = global.app;
	if (app) {
		app.stop();
	}
	// Set config sample for use in test
	process.env.MM_CONFIG_FILE = configFilename;
	if (exec) exec;
	app = require("app.js");
	app.start();
	global.app = app;
	return app;
};

exports.stopApplication = function (app) {
	if (app) {
		app.stop();
	}
};

exports.getDocument = function (callback, ms) {
	const url = "http://" + (config.address || "localhost") + ":" + (config.port || "8080");
	jsdom.JSDOM.fromURL(url, { resources: "usable", runScripts: "dangerously" }).then((dom) => {
		dom.window.onload = function () {
			global.document = dom.window.document;
			setTimeout(() => {
				callback();
			}, ms);
		};
	});
};
