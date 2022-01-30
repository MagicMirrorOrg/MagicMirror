/* MagicMirror²
 *
 * Check the configuration file for errors
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
const Linter = require("eslint").Linter;
const linter = new Linter();

const path = require("path");
const fs = require("fs");

const rootPath = path.resolve(`${__dirname}/../`);
const Log = require(`${rootPath}/js/logger.js`);
const Utils = require(`${rootPath}/js/utils.js`);

/**
 * Returns a string with path of configuration file.
 * Check if set by environment variable MM_CONFIG_FILE
 *
 * @returns {string} path and filename of the config file
 */
function getConfigFile() {
	// FIXME: This function should be in core. Do you want refactor me ;) ?, be good!
	return path.resolve(process.env.MM_CONFIG_FILE || `${rootPath}/config/config.js`);
}

/**
 * Checks the config file using eslint.
 */
function checkConfigFile() {
	const configFileName = getConfigFile();

	// Check if file is present
	if (fs.existsSync(configFileName) === false) {
		Log.error(Utils.colors.error("File not found: "), configFileName);
		throw new Error("No config file present!");
	}

	// Check permission
	try {
		fs.accessSync(configFileName, fs.F_OK);
	} catch (e) {
		Log.error(Utils.colors.error(e));
		throw new Error("No permission to access config file!");
	}

	// Validate syntax of the configuration file.
	Log.info(Utils.colors.info("Checking file... "), configFileName);

	// I'm not sure if all ever is utf-8
	const configFile = fs.readFileSync(configFileName, "utf-8");

	// Explicitly tell linter that he might encounter es6 syntax ("let config = {...}")
	const errors = linter.verify(configFile, {
		env: {
			es6: true
		}
	});

	if (errors.length === 0) {
		Log.info(Utils.colors.pass("Your configuration file doesn't contain syntax errors :)"));
	} else {
		Log.error(Utils.colors.error("Your configuration file contains syntax errors :("));

		for (const error of errors) {
			Log.error(`Line ${error.line} column ${error.column}: ${error.message}`);
		}
	}
}

checkConfigFile();
