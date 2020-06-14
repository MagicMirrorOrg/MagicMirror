/* Magic Mirror
 * The Core App (Server)
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
var fs = require("fs");
var path = require("path");
var Log = require(__dirname + "/logger.js");
var Server = require(__dirname + "/server.js");
var Utils = require(__dirname + "/utils.js");
var defaultModules = require(__dirname + "/../modules/default/defaultmodules.js");

// Alias modules mentioned in package.js under _moduleAliases.
require("module-alias/register");

// Get version number.
global.version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
Log.log("Starting MagicMirror: v" + global.version);

// global absolute root path
global.root_path = path.resolve(__dirname + "/../");

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
	Log.error("MagicMirror will not quit, but it might be a good idea to check why this happened. Maybe no internet connection?");
	Log.error("If you think this really is an issue, please open an issue on GitHub: https://github.com/MichMich/MagicMirror/issues");
});

/* App - The core app.
 */
var App = function () {
	var nodeHelpers = [];

	/* loadConfig(callback)
	 * Loads the config file. combines it with the defaults,
	 * and runs the callback with the found config as argument.
	 *
	 * argument callback function - The callback function.
	 */
	var loadConfig = function (callback) {
		Log.log("Loading config ...");
		var defaults = require(__dirname + "/defaults.js");

		// For this check proposed to TestSuite
		// https://forum.magicmirror.builders/topic/1456/test-suite-for-magicmirror/8
		var configFilename = path.resolve(global.root_path + "/config/config.js");
		if (typeof global.configuration_file !== "undefined") {
			configFilename = path.resolve(global.configuration_file);
		}

		try {
			fs.accessSync(configFilename, fs.F_OK);
			var c = require(configFilename);
			checkDeprecatedOptions(c);
			var config = Object.assign(defaults, c);
			callback(config);
		} catch (e) {
			if (e.code === "ENOENT") {
				Log.error(Utils.colors.error("WARNING! Could not find config file. Please create one. Starting with default configuration."));
			} else if (e instanceof ReferenceError || e instanceof SyntaxError) {
				Log.error(Utils.colors.error("WARNING! Could not validate config file. Starting with default configuration. Please correct syntax errors at or above this line: " + e.stack));
			} else {
				Log.error(Utils.colors.error("WARNING! Could not load config file. Starting with default configuration. Error found: " + e));
			}
			callback(defaults);
		}
	};

	var checkDeprecatedOptions = function (userConfig) {
		var deprecated = require(global.root_path + "/js/deprecated.js");
		var deprecatedOptions = deprecated.configs;

		var usedDeprecated = [];

		deprecatedOptions.forEach(function (option) {
			if (userConfig.hasOwnProperty(option)) {
				usedDeprecated.push(option);
			}
		});
		if (usedDeprecated.length > 0) {
			Log.warn(Utils.colors.warn("WARNING! Your config is using deprecated options: " + usedDeprecated.join(", ") + ". Check README and CHANGELOG for more up-to-date ways of getting the same functionality."));
		}
	};

	/* loadModule(module)
	 * Loads a specific module.
	 *
	 * argument module string - The name of the module (including subpath).
	 */
	var loadModule = function (module, callback) {
		var elements = module.split("/");
		var moduleName = elements[elements.length - 1];
		var moduleFolder = __dirname + "/../modules/" + module;

		if (defaultModules.indexOf(moduleName) !== -1) {
			moduleFolder = __dirname + "/../modules/default/" + module;
		}

		var helperPath = moduleFolder + "/node_helper.js";

		var loadModule = true;
		try {
			fs.accessSync(helperPath, fs.R_OK);
		} catch (e) {
			loadModule = false;
			Log.log("No helper found for module: " + moduleName + ".");
		}

		if (loadModule) {
			var Module = require(helperPath);
			var m = new Module();

			if (m.requiresVersion) {
				Log.log("Check MagicMirror version for node helper '" + moduleName + "' - Minimum version:  " + m.requiresVersion + " - Current version: " + global.version);
				if (cmpVersions(global.version, m.requiresVersion) >= 0) {
					Log.log("Version is ok!");
				} else {
					Log.log("Version is incorrect. Skip module: '" + moduleName + "'");
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
	};

	/* loadModules(modules)
	 * Loads all modules.
	 *
	 * argument module string - The name of the module (including subpath).
	 */
	var loadModules = function (modules, callback) {
		Log.log("Loading module helpers ...");

		var loadNextModule = function () {
			if (modules.length > 0) {
				var nextModule = modules[0];
				loadModule(nextModule, function () {
					modules = modules.slice(1);
					loadNextModule();
				});
			} else {
				// All modules are loaded
				Log.log("All module helpers loaded.");
				callback();
			}
		};

		loadNextModule();
	};

	/* cmpVersions(a,b)
	 * Compare two semantic version numbers and return the difference.
	 *
	 * argument a string - Version number a.
	 * argument a string - Version number b.
	 */
	function cmpVersions(a, b) {
		var i, diff;
		var regExStrip0 = /(\.0+)+$/;
		var segmentsA = a.replace(regExStrip0, "").split(".");
		var segmentsB = b.replace(regExStrip0, "").split(".");
		var l = Math.min(segmentsA.length, segmentsB.length);

		for (i = 0; i < l; i++) {
			diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
			if (diff) {
				return diff;
			}
		}
		return segmentsA.length - segmentsB.length;
	}

	/* start(callback)
	 * This methods starts the core app.
	 * It loads the config, then it loads all modules.
	 * When it's done it executes the callback with the config as argument.
	 *
	 * argument callback function - The callback function.
	 */
	this.start = function (callback) {
		loadConfig(function (c) {
			config = c;

			var modules = [];

			for (var m in config.modules) {
				var module = config.modules[m];
				if (modules.indexOf(module.module) === -1 && !module.disabled) {
					modules.push(module.module);
				}
			}

			loadModules(modules, function () {
				var server = new Server(config, function (app, io) {
					Log.log("Server started ...");

					for (var h in nodeHelpers) {
						var nodeHelper = nodeHelpers[h];
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

	/* stop()
	 * This methods stops the core app.
	 * This calls each node_helper's STOP() function, if it exists.
	 * Added to fix #1056
	 */
	this.stop = function () {
		for (var h in nodeHelpers) {
			var nodeHelper = nodeHelpers[h];
			if (typeof nodeHelper.stop === "function") {
				nodeHelper.stop();
			}
		}
	};

	/* Listen for SIGINT signal and call stop() function.
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

	/* We also need to listen to SIGTERM signals so we stop everything when we are asked to stop by the OS.
	 */
	process.on("SIGTERM", () => {
		Log.log("[SIGTERM] Received. Shutting down server...");
		setTimeout(() => {
			process.exit(0);
		}, 3000); // Force quit after 3 seconds
		this.stop();
		process.exit(0);
	});
};

module.exports = new App();
