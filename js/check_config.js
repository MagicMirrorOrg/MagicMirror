/* Magic Mirror
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

const rootPath = path.resolve(__dirname + "/../");
const config = require(rootPath + "/.eslintrc.json");
const Utils = require(rootPath + "/js/utils.js");

/* getConfigFile()
 * Return string with path of configuration file
 * Check if set by environment variable MM_CONFIG_FILE
 */
function getConfigFile() {
	// FIXME: This function should be in core. Do you want refactor me ;) ?, be good!
	let configFileName = path.resolve(rootPath + "/config/config.js");
	if (process.env.MM_CONFIG_FILE) {
		configFileName = path.resolve(process.env.MM_CONFIG_FILE);
	}
	return configFileName;
}

function checkConfigFile() {
	const configFileName = getConfigFile();

	// Check if file is present
	if (fs.existsSync(configFileName) === false) {
		console.error(Utils.colors.error("File not found: "), configFileName);
		throw new Error("No config file present!");
	}

	// check permission
	try {
		fs.accessSync(configFileName, fs.F_OK);
	} catch (e) {
		console.log(Utils.colors.error(e));
		throw new Error("No permission to access config file!");
	}

	// Validate syntax of the configuration file.
	// In case the there errors show messages and
	// return
	console.info(Utils.colors.info("Checking file... "), configFileName);

	// I'm not sure if all ever is utf-8
	fs.readFile(configFileName, "utf-8", function (err, data) {
		if (err) {
			throw err;
		}
		const messages = linter.verify(data, config);
		if (messages.length === 0) {
			console.log("Your configuration file doesn't contain syntax errors :)");
			return true;
		} else {
			messages.forEach((error) => {
				console.log("Line", error.line, "col", error.column, error.message);
			});
			throw new Error("Wrong syntax in config file!");
		}
	});
}

checkConfigFile();
