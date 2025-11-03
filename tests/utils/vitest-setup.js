/**
 * Vitest setup file for module aliasing and CI logging
 * This allows require("logger") to work in unit tests
 */

const Module = require("node:module");
const path = require("node:path");

// Suppress debug/info logs in CI to keep output clean
if (process.env.CI === "true" && !process.env.LOG_LEVEL) {
	process.env.LOG_LEVEL = "ERROR";
}

// Store the original require
const originalRequire = Module.prototype.require;

// Override require to handle our custom aliases
Module.prototype.require = function (id) {
	// Handle "logger" alias
	if (id === "logger") {
		return originalRequire.call(this, path.resolve(__dirname, "../../js/logger.js"));
	}

	// Handle all other requires normally
	return originalRequire.apply(this, arguments);
};
