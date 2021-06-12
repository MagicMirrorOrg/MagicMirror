/*
 * Magic Mirror Global Setup Test Suite
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
const Application = require("spectron").Application;
const assert = require("assert");
const path = require("path");
const EventEmitter = require("events");

exports.getElectronPath = function () {
	let electronPath = path.join(__dirname, "..", "..", "node_modules", ".bin", "electron");
	if (process.platform === "win32") {
		electronPath += ".cmd";
	}
	return electronPath;
};

// Set timeout - if this is run as CI Job, increase timeout
exports.setupTimeout = function (test) {
	if (process.env.CI) {
		jest.setTimeout(30000);
	} else {
		jest.setTimeout(10000);
	}
};

exports.startApplication = function (options) {
	const emitter = new EventEmitter();
	emitter.setMaxListeners(100);

	options.path = exports.getElectronPath();
	if (process.env.CI) {
		options.startTimeout = 30000;
	}

	const app = new Application(options);
	return app.start().then(function () {
		assert.strictEqual(app.isRunning(), true);
		return app;
	});
};

exports.stopApplication = function (app) {
	if (!app || !app.isRunning()) {
		return;
	}

	return app.stop().then(function () {
		assert.strictEqual(app.isRunning(), false);
	});
};
