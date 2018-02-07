/* Magic Mirror
 *
 * Checker configuration file
 *
 * By Rodrigo Ramírez Norambuena
 *    https://rodrigoramirez.com
 *
 * MIT Licensed.
 *
 */

var v = require("jshint");
var path = require("path");
var fs = require("fs");
var Utils = require(__dirname + "/../../js/utils.js");

/* getConfigFile()
 * Return string with path of configuration file
 * Check if set by enviroment variable MM_CONFIG_FILE
 */
function getConfigFile() {
	// FIXME: This function should be in core. Do you want refactor me ;) ?, be good!
	rootPath = path.resolve(__dirname + "/../../");
	var configFileName = path.resolve(rootPath + "/config/config.js");
	if (process.env.MM_CONFIG_FILE) {
		configFileName = path.resolve(process.env.MM_CONFIG_FILE);
	}
	return configFileName;
}

function checkConfigFile() {
	var configFileName = getConfigFile();
	// Check if file is present
	if (fs.existsSync(configFileName) === false) {
		console.error(Utils.colors.error("File not found: "), configFileName);
		return;
	}
	// check permision
	try {
		fs.accessSync(configFileName, fs.F_OK);
	} catch (e) {
		console.log(Utils.colors.error(e));
		return;
	}

	// Validate syntax of the configuration file.
	// In case the there errors show messages and
	// return
	console.info(Utils.colors.info("Checking file... ", configFileName));
	// I'm not sure if all ever is utf-8
	fs.readFile(configFileName, "utf-8", function (err, data) {
		if (err) { throw err; }
		v.JSHINT(data); // Parser by jshint

		if (v.JSHINT.errors.length == 0) {
			console.log("Your configuration file doesn't contain syntax errors :)");
			return true;
		} else {
			errors = v.JSHINT.data().errors;
			for (idx in errors) {
				error = errors[idx];
				console.log("Line", error.line, "col", error.character, error.reason);
			}
		}
	});
}

if (process.env.NODE_ENV !== "test") {
	checkConfigFile();
};