/* MagicMirror²
 * The Core App (Server)
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */

// Alias modules mentioned in package.js under _moduleAliases.
require("module-alias/register");

const fs = require("fs/promises");
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
	 * @returns {Promise} A promise with the config that should be used
	 */
	async function loadConfig() {
		Log.log("Loading config ...");
		const defaults = require(`${__dirname}/defaults`);

		// For this check proposed to TestSuite
		// https://forum.magicmirror.builders/topic/1456/test-suite-for-magicmirror/8
		const configFilename = path.resolve(global.configuration_file || `${global.root_path}/config/config.js`);

		try {
			await fs.access(configFilename, fs.F_OK);
			const c = require(configFilename);
			checkDeprecatedOptions(c);
			const config = Object.assign(defaults, c);
			return config;
		} catch (e) {
			if (e.code === "ENOENT") {
				Log.error(Utils.colors.error("WARNING! Could not find config file. Please create one. Starting with default configuration."));
			} else if (e instanceof ReferenceError || e instanceof SyntaxError) {
				Log.error(Utils.colors.error(`WARNING! Could not validate config file. Starting with default configuration. Please correct syntax errors at or above this line: ${e.stack}`));
			} else {
				Log.error(Utils.colors.error(`WARNING! Could not load config file. Starting with default configuration. Error found: ${e}`));
			}
			return defaults;
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
	 * @returns {Promise} A promise that resolves as soon as the module is loaded.
	 */
	async function loadModule(module) {
		const elements = module.split("/");
		const moduleName = elements[elements.length - 1];
		let moduleFolder = `${__dirname}/../modules/${module}`;

		if (defaultModules.includes(moduleName)) {
			moduleFolder = `${__dirname}/../modules/default/${module}`;
		}

		const helperPath = await resolveHelperPath(moduleFolder);

		if (helperPath) {
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

			return new Promise((resolve, reject) => {
				m.loaded(resolve);
			});
		} else {
			Log.log(`No helper found for module: ${moduleName}.`);
			return Promise.resolve();
		}
	}

	/**
	 * Loads all modules.
	 *
	 * @param {Module[]} modules All modules to be loaded
	 * @returns {Promise} A promise that is resolved when all modules been loaded
	 */
	async function loadModules(modules) {
		Log.log("Loading module helpers ...");

		for (let module of modules) {
			await loadModule(module);
		}

		Log.log("All module helpers loaded.");
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
	 * Resolves the path to the node_helper
	 *
	 * @param {string} moduleFolder the folder that should contain the node_helper
	 * @returns {Promise} A promise with the path to the node_helper that should be used, or undefined if none exists
	 */
	async function resolveHelperPath(moduleFolder) {
		const helperPath = `${moduleFolder}/node_helper.js`;

		try {
			await fs.access(helperPath, fs.R_OK);
			return helperPath;
		} catch (e) {
			// The current extension may not have been found, try the next instead
			return undefined;
		}
	}

	/**
	 * Start the core app.
	 *
	 * It loads the config, then it loads all modules. When it's done it
	 * executes the callback with the config as argument.
	 *
	 * @returns {Promise} A promise containing the config, it is resolved when the server has loaded all modules and are listening for requests
	 */
	this.start = async function () {
		config = await loadConfig();

		Log.setLogLevel(config.logLevel);

		let modules = [];

		for (const module of config.modules) {
			if (!modules.includes(module.module) && !module.disabled) {
				modules.push(module.module);
			}
		}

		await loadModules(modules);

		httpServer = new Server(config);
		const { app, io } = await httpServer.open();
		Log.log("Server started ...");

		const nodePromises = [];
		for (let nodeHelper of nodeHelpers) {
			nodeHelper.setExpressApp(app);
			nodeHelper.setSocketIO(io);

			try {
				nodePromises.push(nodeHelper.start());
			} catch (error) {
				Log.error(`Error when starting node_helper for module ${nodeHelper.name}:`);
				Log.error(error);
			}
		}

		let results = await Promise.allSettled(nodePromises);
		// Log errors that happened during async node_helper startup
		results.forEach((result) => {
			if (result.status === "rejected") {
				Log.error(result.reason);
			}
		});

		Log.log("Sockets connected & modules started ...");
		return config;
	};

	/**
	 * Stops the core app. This calls each node_helper's STOP() function, if it
	 * exists.
	 *
	 * Added to fix #1056
	 *
	 * @param {number} timeout the amount of milliseconds before the returned promise should be automatically resolved
	 * @returns {Promise} A promise that is resolved when all node_helpers and the http server has been closed
	 */
	this.stop = async function (timeout) {
		for (const nodeHelper of nodeHelpers) {
			if (typeof nodeHelper.stop === "function") {
				nodeHelper.stop();
			}
		}

		// To be able to stop the app even if it hasn't been started (when running with Electron against another server)
		if (!httpServer) {
			return Promise.resolve();
		}

		let serverClosePromise = httpServer.close();

		// If a timeout is set, resolve when the server is closed or the timeout has been reached
		if (timeout) {
			let timeoutPromise = new Promise((resolve) => {
				setTimeout(resolve, timeout);
			});

			return Promise.race([serverClosePromise, timeoutPromise]);
		} else {
			return serverClosePromise;
		}
	};

	/**
	 * Listen for SIGINT signal and call stop() function.
	 *
	 * Added to fix #1056
	 * Note: this is only used if running `server-only`. Otherwise
	 * this.stop() is called by app.on("before-quit"... in `electron.js`
	 */
	process.on("SIGINT", async () => {
		Log.log("[SIGINT] Received. Shutting down server...");
		await this.stop(3000); // Force quit after 3 seconds
		process.exit(0);
	});

	/**
	 * Listen to SIGTERM signals so we can stop everything when we
	 * are asked to stop by the OS.
	 */
	process.on("SIGTERM", async () => {
		Log.log("[SIGTERM] Received. Shutting down server...");
		await this.stop(3000); // Force quit after 3 seconds
		process.exit(0);
	});
}

module.exports = new App();
