/*
 * Magic Mirror
 *
 * Global Setup Test Suite
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 *
*/

const Application = require("spectron").Application;
const assert = require("assert");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

const path = require("path");

global.before(function() {
	chai.should();
	chai.use(chaiAsPromised);
});

exports.getElectronPath = function() {
	var electronPath = path.join(__dirname, "..", "..", "node_modules", ".bin", "electron");
	if (process.platform === "win32") {
		electronPath += ".cmd";
	}
	return electronPath;
};

// Set timeout - if this is run within Travis, increase timeout
exports.setupTimeout = function(test) {
	if (process.env.CI) {
		test.timeout(30000);
	} else {
		test.timeout(10000);
	}
};

exports.startApplication = function(options) {
	options.path = exports.getElectronPath();
	if (process.env.CI) {
		options.startTimeout = 30000;
	}

	var app = new Application(options);
	return app.start().then(function() {
		assert.equal(app.isRunning(), true);
		chaiAsPromised.transferPromiseness = app.transferPromiseness;
		return app;
	});
};

exports.stopApplication = function(app) {
	if (!app || !app.isRunning()) {
		return;
	}

	return app.stop().then(function() {
		assert.equal(app.isRunning(), false);
	});
};
