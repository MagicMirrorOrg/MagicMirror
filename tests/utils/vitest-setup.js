/**
 * Vitest setup file for module aliasing and CI logging
 * This allows require("logger") to work in unit tests
 */

const Module = require("node:module");
const path = require("node:path");

// Set test mode flag for application code to detect test environment
process.env.mmTestMode = "true";

// Store the original require
const originalRequire = Module.prototype.require;

// Track if we've already applied log level
let logLevelApplied = false;

// Override require to handle our custom aliases
Module.prototype.require = function (id) {
	// Handle "logger" alias
	if (id === "logger") {
		const logger = originalRequire.call(this, path.resolve(__dirname, "../../js/logger.js"));

		// Suppress debug/info logs in CI to keep output clean
		if (!logLevelApplied && process.env.CI === "true") {
			logger.setLogLevel("ERROR");
			logLevelApplied = true;
		}

		return logger;
	}

	// Handle all other requires normally
	return originalRequire.apply(this, arguments);
};
