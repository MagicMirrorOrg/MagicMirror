/* MagicMirror²
 * The Core App (Server)
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */

// Alias modules mentioned in package.js under _moduleAliases.
require("module-alias/register");

const fs = require("fs");
const path = require("path");
const Log = require("logger");
const Server = require(`${__dirname}/server`);
const Utils = require(`${__dirname}/utils`);
const defaultModules = require(`${__dirname}/../modules/default/defaultmodules`);

// Get version number.
global.version = require(`${__dirname}/../package.json`).version;
Log.log("Starting MagicMirror: v" + global.version);

// global absolute root path
global.root_path = path.resolve(`${__dirname}/../`);

if (process.env.MM_CONFIG_FILE) {
	global.configuration_file = process.env.MM_CONFIG_FILE;
}

// FIXME: Hotfix Pull Request
// https://github.com/MichMich/MagicMirror/pull/673
if (process.env.MM_PORT) {
	global.mmPort = process.env.MM_PORT;
}

// The next part is here to prevent a major exception when there
// is no internet connection. This could probable be solved better.
process.on("uncaughtException", function (err) {
	Log.error("Whoops! There was an uncaught exception...");
	Log.error(err);
	Log.error("MagicMirror² will not quit, but it might be a good idea to check why this happened. Maybe no internet connection?");
	Log.error("If you think this really is an issue, please open an issue on GitHub: https://github.com/MichMich/MagicMirror/issues");
});

/**
 * The core app.
 *
 * @class
 */
function App() {
	let nodeHelpers = [];
	let httpServer;

	/**
	 * Loads the config file. Combines it with the defaults, and runs the
	 * callback with the found config as argument.
	 *
	 * @param {Function} callback Function to be called after loading the config
	 */
	function loadConfig(callback) {
		Log.log("Loading config ...");
		const defaults = require(`${__dirname}/defaults`);

		// For this check proposed to TestSuite
		// https://forum.magicmirror.builders/topic/1456/test-suite-for-magicmirror/8
		const configFilename = path.resolve(global.configuration_file || `${global.root_path}/config/config.js`);

		try {
			fs.accessSync(configFilename, fs.F_OK);
			const c = require(configFilename);
			checkDeprecatedOptions(c);
			const config = Object.assign(defaults, c);
			callback(config);
		} catch (e) {
			if (e.code === "ENOENT") {
				Log.error(Utils.colors.error("WARNING! Could not find config file. Please create one. Starting with default configuration."));
			} else if (e instanceof ReferenceError || e instanceof SyntaxError) {
				Log.error(Utils.colors.error(`WARNING! Could not validate config file. Starting with default configuration. Please correct syntax errors at or above this line: ${e.stack}`));
			} else {
				Log.error(Utils.colors.error(`WARNING! Could not load config file. Starting with default configuration. Error found: ${e}`));
			}
			callback(defaults);
		}
	}

	/**
	 * Checks the config for deprecated options and throws a warning in the logs
	 * if it encounters one option from the deprecated.js list
	 *
	 * @param {object} userConfig The user config
	 */
	function checkDeprecatedOptions(userConfig) {
		const deprecated = require(`${global.root_path}/js/deprecated`);
		const deprecatedOptions = deprecated.configs;

		const usedDeprecated = deprecatedOptions.filter((option) => userConfig.hasOwnProperty(option));
		if (usedDeprecated.length > 0) {
			Log.warn(Utils.colors.warn(`WARNING! Your config is using deprecated options: ${usedDeprecated.join(", ")}. Check README and CHANGELOG for more up-to-date ways of getting the same functionality.`));
		}
	}

	/**
	 * Loads a specific module.
	 *
	 * @param {string} module The name of the module (including subpath).
	 * @param {Function} callback Function to be called after loading
	 */
	function loadModule(module, callback) {
		const elements = module.split("/");
		const moduleName = elements[elements.length - 1];
		let moduleFolder = `${__dirname}/../modules/${module}`;

		if (defaultModules.includes(moduleName)) {
			moduleFolder = `${__dirname}/../modules/default/${module}`;
		}

		const helperPath = `${moduleFolder}/node_helper.js`;

		let loadHelper = true;
		try {
			fs.accessSync(helperPath, fs.R_OK);
		} catch (e) {
			loadHelper = false;
			Log.log(`No helper found for module: ${moduleName}.`);
		}

		if (loadHelper) {
			const Module = require(helperPath);
			let m = new Module();

			if (m.requiresVersion) {
				Log.log(`Check MagicMirror² version for node helper '${moduleName}' - Minimum version: ${m.requiresVersion} - Current version: ${global.version}`);
				if (cmpVersions(global.version, m.requiresVersion) >= 0) {
					Log.log("Version is ok!");
				} else {
					Log.warn(`Version is incorrect. Skip module: '${moduleName}'`);
					return;
				}
			}

			m.setName(moduleName);
			m.setPath(path.resolve(moduleFolder));
			nodeHelpers.push(m);

			m.loaded(callback);
		} else {
			callback();
		}
	}

	/**
	 * Loads all modules.
	 *
	 * @param {Module[]} modules All modules to be loaded
	 * @param {Function} callback Function to be called after loading
	 */
	function loadModules(modules, callback) {
		Log.log("Loading module helpers ...");

		/**
		 *
		 */
		function loadNextModule() {
			if (modules.length > 0) {
				const nextModule = modules[0];
				loadModule(nextModule, function () {
					modules = modules.slice(1);
					loadNextModule();
				});
			} else {
				// All modules are loaded
				Log.log("All module helpers loaded.");
				callback();
			}
		}

		loadNextModule();
	}

	/**
	 * Compare two semantic version numbers and return the difference.
	 *
	 * @param {string} a Version number a.
	 * @param {string} b Version number b.
	 * @returns {number} A positive number if a is larger than b, a negative
	 * number if a is smaller and 0 if they are the same
	 */
	function cmpVersions(a, b) {
		let i, diff;
		const regExStrip0 = /(\.0+)+$/;
		const segmentsA = a.replace(regExStrip0, "").split(".");
		const segmentsB = b.replace(regExStrip0, "").split(".");
		const l = Math.min(segmentsA.length, segmentsB.length);

		for (i = 0; i < l; i++) {
			diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
			if (diff) {
				return diff;
			}
		}
		return segmentsA.length - segmentsB.length;
	}

	/**
	 * Start the core app.
	 *
	 * It loads the config, then it loads all modules. When it's done it
	 * executes the callback with the config as argument.
	 *
	 * @param {Function} callback Function to be called after start
	 */
	this.start = function (callback) {
		loadConfig(function (c) {
			config = c;

			Log.setLogLevel(config.logLevel);

			let modules = [];

			for (const module of config.modules) {
				if (!modules.includes(module.module) && !module.disabled) {
					modules.push(module.module);
				}
			}

			loadModules(modules, function () {
				httpServer = new Server(config, function (app, io) {
					Log.log("Server started ...");

					for (let nodeHelper of nodeHelpers) {
						nodeHelper.setExpressApp(app);
						nodeHelper.setSocketIO(io);
						nodeHelper.start();
					}

					Log.log("Sockets connected & modules started ...");

					if (typeof callback === "function") {
						callback(config);
					}
				});
			});
		});
	};

	/**
	 * Stops the core app. This calls each node_helper's STOP() function, if it
	 * exists.
	 *
	 * Added to fix #1056
	 */
	this.stop = function () {
		for (const nodeHelper of nodeHelpers) {
			if (typeof nodeHelper.stop === "function") {
				nodeHelper.stop();
			}
		}
		httpServer.close();
	};

	/**
	 * Listen for SIGINT signal and call stop() function.
	 *
	 * Added to fix #1056
	 * Note: this is only used if running `server-only`. Otherwise
	 * this.stop() is called by app.on("before-quit"... in `electron.js`
	 */
	process.on("SIGINT", () => {
		Log.log("[SIGINT] Received. Shutting down server...");
		setTimeout(() => {
			process.exit(0);
		}, 3000); // Force quit after 3 seconds
		this.stop();
		process.exit(0);
	});

	/**
	 * Listen to SIGTERM signals so we can stop everything when we
	 * are asked to stop by the OS.
	 */
	process.on("SIGTERM", () => {
		Log.log("[SIGTERM] Received. Shutting down server...");
		setTimeout(() => {
			process.exit(0);
		}, 3000); // Force quit after 3 seconds
		this.stop();
		process.exit(0);
	});
}

module.exports = new App();
