// Alias modules mentioned in package.js under _moduleAliases.
require("module-alias/register");

const fs = require("node:fs");
const path = require("node:path");
const envsub = require("envsub");
const Log = require("logger");

const Server = require(`${__dirname}/server`);
const Utils = require(`${__dirname}/utils`);
const defaultModules = require(`${__dirname}/../modules/default/defaultmodules`);
const { getEnvVarsAsObj } = require(`${__dirname}/server_functions`);

// used to control fetch timeout for node_helpers
const { setGlobalDispatcher, Agent } = require("undici");
// common timeout value, provide environment override in case
const fetch_timeout = process.env.mmFetchTimeout !== undefined ? process.env.mmFetchTimeout : 30000;

// Get version number.
global.version = require(`${__dirname}/../package.json`).version;
global.mmTestMode = process.env.mmTestMode === "true";
Log.log(`Starting MagicMirror: v${global.version}`);

// Log system information.
Utils.logSystemInformation();

// global absolute root path
global.root_path = path.resolve(`${__dirname}/../`);

if (process.env.MM_CONFIG_FILE) {
	global.configuration_file = process.env.MM_CONFIG_FILE.replace(`${global.root_path}/`, "");
}

// FIXME: Hotfix Pull Request
// https://github.com/MagicMirrorOrg/MagicMirror/pull/673
if (process.env.MM_PORT) {
	global.mmPort = process.env.MM_PORT;
}

// The next part is here to prevent a major exception when there
// is no internet connection. This could probable be solved better.
process.on("uncaughtException", function (err) {
	// ignore strange exceptions under aarch64 coming from systeminformation:
	if (!err.stack.includes("node_modules/systeminformation")) {
		Log.error("Whoops! There was an uncaught exception...");
		Log.error(err);
		Log.error("MagicMirror² will not quit, but it might be a good idea to check why this happened. Maybe no internet connection?");
		Log.error("If you think this really is an issue, please open an issue on GitHub: https://github.com/MagicMirrorOrg/MagicMirror/issues");
	}
});

/**
 * The core app.
 * @class
 */
function App () {
	let nodeHelpers = [];
	let httpServer;

	/**
	 * Loads the config file. Combines it with the defaults and returns the config
	 * @async
	 * @returns {Promise<object>} the loaded config or the defaults if something goes wrong
	 */
	async function loadConfig () {
		Log.log("Loading config ...");
		const defaults = require(`${__dirname}/defaults`);
		if (process.env.JEST_WORKER_ID !== undefined) {
			// if we are running with jest
			defaults.address = "0.0.0.0";
		}

		// For this check proposed to TestSuite
		// https://forum.magicmirror.builders/topic/1456/test-suite-for-magicmirror/8
		const configFilename = path.resolve(global.configuration_file || `${global.root_path}/config/config.js`);
		let templateFile = `${configFilename}.template`;

		// check if templateFile exists
		try {
			fs.accessSync(templateFile, fs.F_OK);
		} catch (err) {
			templateFile = null;
			Log.log("config template file not exists, no envsubst");
		}

		if (templateFile) {
			// save current config.js
			try {
				if (fs.existsSync(configFilename)) {
					fs.copyFileSync(configFilename, `${configFilename}-old`);
				}
			} catch (err) {
				Log.warn(`Could not copy ${configFilename}: ${err.message}`);
			}

			// check if config.env exists
			const envFiles = [];
			const configEnvFile = `${configFilename.substr(0, configFilename.lastIndexOf("."))}.env`;
			try {
				if (fs.existsSync(configEnvFile)) {
					envFiles.push(configEnvFile);
				}
			} catch (err) {
				Log.log(`${configEnvFile} does not exist. ${err.message}`);
			}

			let options = {
				all: true,
				diff: false,
				envFiles: envFiles,
				protect: false,
				syntax: "default",
				system: true
			};

			// envsubst variables in templateFile and create new config.js
			// naming for envsub must be templateFile and outputFile
			const outputFile = configFilename;
			try {
				await envsub({ templateFile, outputFile, options });
			} catch (err) {
				Log.error(`Could not envsubst variables: ${err.message}`);
			}
		}

		require(`${global.root_path}/js/check_config.js`);

		try {
			fs.accessSync(configFilename, fs.F_OK);
			const c = require(configFilename);
			if (Object.keys(c).length === 0) {
				Log.error("WARNING! Config file appears empty, maybe missing module.exports last line?");
			}
			checkDeprecatedOptions(c);
			return Object.assign(defaults, c);
		} catch (e) {
			if (e.code === "ENOENT") {
				Log.error("WARNING! Could not find config file. Please create one. Starting with default configuration.");
			} else if (e instanceof ReferenceError || e instanceof SyntaxError) {
				Log.error(`WARNING! Could not validate config file. Starting with default configuration. Please correct syntax errors at or above this line: ${e.stack}`);
			} else {
				Log.error(`WARNING! Could not load config file. Starting with default configuration. Error found: ${e}`);
			}
		}

		return defaults;
	}

	/**
	 * Checks the config for deprecated options and throws a warning in the logs
	 * if it encounters one option from the deprecated.js list
	 * @param {object} userConfig The user config
	 */
	function checkDeprecatedOptions (userConfig) {
		const deprecated = require(`${global.root_path}/js/deprecated`);
		const deprecatedOptions = deprecated.configs;

		const usedDeprecated = deprecatedOptions.filter((option) => userConfig.hasOwnProperty(option));
		if (usedDeprecated.length > 0) {
			Log.warn(`WARNING! Your config is using deprecated options: ${usedDeprecated.join(", ")}. Check README and CHANGELOG for more up-to-date ways of getting the same functionality.`);
		}
	}

	/**
	 * Loads a specific module.
	 * @param {string} module The name of the module (including subpath).
	 */
	function loadModule (module) {
		const elements = module.split("/");
		const moduleName = elements[elements.length - 1];
		const env = getEnvVarsAsObj();
		let moduleFolder = path.resolve(`${__dirname}/../${env.modulesDir}`, module);

		if (defaultModules.includes(moduleName)) {
			const defaultModuleFolder = path.resolve(`${__dirname}/../modules/default/`, module);
			if (process.env.JEST_WORKER_ID === undefined) {
				moduleFolder = defaultModuleFolder;
			} else {
				// running in Jest, allow defaultModules placed under moduleDir for testing
				if (env.modulesDir === "modules") {
					moduleFolder = defaultModuleFolder;
				}
			}
		}

		const moduleFile = `${moduleFolder}/${moduleName}.js`;

		try {
			fs.accessSync(moduleFile, fs.R_OK);
		} catch (e) {
			Log.warn(`No ${moduleFile} found for module: ${moduleName}.`);
		}

		const helperPath = `${moduleFolder}/node_helper.js`;

		let loadHelper = true;
		try {
			fs.accessSync(helperPath, fs.R_OK);
		} catch (e) {
			loadHelper = false;
			Log.log(`No helper found for module: ${moduleName}.`);
		}

		// if the helper was found
		if (loadHelper) {
			let Module;
			try {
				Module = require(helperPath);
			} catch (e) {
				Log.error(`Error when loading ${moduleName}:`, e.message);
				return;
			}
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

			m.loaded();
		}
	}

	/**
	 * Loads all modules.
	 * @param {Module[]} modules All modules to be loaded
	 * @returns {Promise} A promise that is resolved when all modules been loaded
	 */
	async function loadModules (modules) {
		Log.log("Loading module helpers ...");

		for (let module of modules) {
			await loadModule(module);
		}

		Log.log("All module helpers loaded.");
	}

	/**
	 * Compare two semantic version numbers and return the difference.
	 * @param {string} a Version number a.
	 * @param {string} b Version number b.
	 * @returns {number} A positive number if a is larger than b, a negative
	 * number if a is smaller and 0 if they are the same
	 */
	function cmpVersions (a, b) {
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
	 * It loads the config, then it loads all modules.
	 * @async
	 * @returns {Promise<object>} the config used
	 */
	this.start = async function () {
		config = await loadConfig();

		Log.setLogLevel(config.logLevel);

		// get the used module positions
		Utils.getModulePositions();

		let modules = [];
		for (const module of config.modules) {
			if (module.disabled) continue;
			if (module.module) {
				if (Utils.moduleHasValidPosition(module.position) || typeof (module.position) === "undefined") {
					// Only add this module to be loaded if it is not a duplicate (repeated instance of the same module)
					if (!modules.includes(module.module)) {
						modules.push(module.module);
					}
				} else {
					Log.warn("Invalid module position found for this configuration:" + `\n${JSON.stringify(module, null, 2)}`);
				}
			} else {
				Log.warn("No module name found for this configuration:" + `\n${JSON.stringify(module, null, 2)}`);
			}
		}

		setGlobalDispatcher(new Agent({ connect: { timeout: fetch_timeout } }));

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

		const results = await Promise.allSettled(nodePromises);

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
	 * @returns {Promise} A promise that is resolved when all node_helpers and
	 * the http server has been closed
	 */
	this.stop = async function () {
		const nodePromises = [];
		for (let nodeHelper of nodeHelpers) {
			try {
				if (typeof nodeHelper.stop === "function") {
					nodePromises.push(nodeHelper.stop());
				}
			} catch (error) {
				Log.error(`Error when stopping node_helper for module ${nodeHelper.name}:`);
				console.error(error);
			}
		}

		const results = await Promise.allSettled(nodePromises);

		// Log errors that happened during async node_helper stopping
		results.forEach((result) => {
			if (result.status === "rejected") {
				Log.error(result.reason);
			}
		});

		Log.log("Node_helpers stopped ...");

		// To be able to stop the app even if it hasn't been started (when
		// running with Electron against another server)
		if (!httpServer) {
			return Promise.resolve();
		}

		return httpServer.close();
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
		setTimeout(() => {
			process.exit(0);
		}, 3000); // Force quit after 3 seconds
		await this.stop();
		process.exit(0);
	});

	/**
	 * Listen to SIGTERM signals so we can stop everything when we
	 * are asked to stop by the OS.
	 */
	process.on("SIGTERM", async () => {
		Log.log("[SIGTERM] Received. Shutting down server...");
		setTimeout(() => {
			process.exit(0);
		}, 3000); // Force quit after 3 seconds
		await this.stop();
		process.exit(0);
	});
}

module.exports = new App();
