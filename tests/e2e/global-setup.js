const jsdom = require("jsdom");

exports.startApplication = function (configFilename, exec) {
	jest.resetModules();
	// Set config sample for use in test
	process.env.MM_CONFIG_FILE = configFilename;
	if (exec) exec;
	const app = require("app.js");
	app.start();

	return app;
};

exports.stopApplication = function (app) {
	if (app) {
		app.stop();
	}
};

exports.getDocument = function (url, callback) {
	jsdom.JSDOM.fromURL(url, { resources: "usable", runScripts: "dangerously" }).then((dom) => {
		dom.window.onload = function () {
			global.document = dom.window.document;
			callback();
		};
	});
};
