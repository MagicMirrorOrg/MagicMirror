/* Magic Mirror
 * The Core App (Server)
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var fs = require("fs");
var Server = require(__dirname + "/server.js");
var defaultModules = require(__dirname + "/../modules/default/defaultmodules.js");
var path = require("path");

// The next part is here to prevent a major exception when there
// is no internet connection. This could probable be solved better.
process.on("uncaughtException", function (err) {
	console.log("Whoops! There was an uncaught exception...");
	console.error(err);
	console.log("MagicMirror will not quit, but it might be a good idea to check why this happened. Maybe no internet connection?");
	console.log("If you think this really is an issue, please open an issue on GitHub: https://github.com/MichMich/MagicMirror/issues");
});

/* App - The core app.
 */
var App = function() {
	var nodeHelpers = [];

	/* loadConfig(callback)
	 * Loads the config file. combines it with the defaults,
	 * and runs the callback with the found config as argument.
	 *
	 * argument callback function - The callback function.
	 */

	var loadConfig = function(callback) {
		console.log("Loading config ...");
		var defaults = require(__dirname + "/defaults.js");
		var configFilename = path.resolve(__dirname + "/../config/config.js");
		try {
			fs.accessSync(configFilename, fs.F_OK);
			var c = require(configFilename);
			var config = Object.assign(defaults, c);
			callback(config);
		} catch (e) {
			console.error("WARNING! Could not find config. Please create one.");
			callback(defaults);
		}
	};

	/* loadModule(module)
	 * Loads a specific module.
	 *
	 * argument module string - The name of the module (including subpath).
	 */
	var loadModule = function(module) {

		var elements = module.split("/");
		var moduleName = elements[elements.length - 1];
		var moduleFolder =  __dirname + "/../modules/" + module;

		if (defaultModules.indexOf(moduleName) !== -1) {
			moduleFolder =  __dirname + "/../modules/default/" + module;
		}

		var helperPath = moduleFolder + "/node_helper.js";

		var loadModule = true;
		try {
			fs.accessSync(helperPath, fs.R_OK);
		} catch (e) {
			loadModule = false;
			console.log("No helper found for module: " + moduleName + ".");
		}

		if (loadModule) {
			var Module = require(helperPath);
			var m = new Module();
			m.setName(moduleName);
			m.setPath(path.resolve(moduleFolder));
			nodeHelpers.push(m);
		}
	};

	/* loadModules(modules)
	 * Loads all modules.
	 *
	 * argument module string - The name of the module (including subpath).
	 */
	var loadModules = function(modules) {
		console.log("Loading module helpers ...");

		for (var m in modules) {
			loadModule(modules[m]);
		}

		console.log("All module helpers loaded.");
	};

	/* start(callback)
	 * This methods starts the core app.
	 * It loads the config, then it loads all modules.
	 * When it"s done it executs the callback with the config as argument.
	 *
	 * argument callback function - The callback function.
	 */
	this.start = function(callback) {

		loadConfig(function(c) {
			config = c;

			var modules = [];

			for (var m in config.modules) {
				var module = config.modules[m];
				if (modules.indexOf(module.module) === -1) {
					modules.push(module.module);
				}
			}

			loadModules(modules);

			var server = new Server(config, function(app, io) {
				console.log("Server started ...");

				for (var h in nodeHelpers) {
					var nodeHelper = nodeHelpers[h];
					nodeHelper.setExpressApp(app);
					nodeHelper.setSocketIO(io);
					nodeHelper.start();
				}

				console.log("Sockets connected & modules started ...");

				if (typeof callback === "function") {
					callback(config);
				}

			});
		});
	};
};

module.exports = new App();