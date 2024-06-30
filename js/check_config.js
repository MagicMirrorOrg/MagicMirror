const path = require("node:path");
const fs = require("node:fs");
const colors = require("ansis");
const { Linter } = require("eslint");

const linter = new Linter();

const Ajv = require("ajv");

const ajv = new Ajv();

const rootPath = path.resolve(`${__dirname}/../`);
const Log = require(`${rootPath}/js/logger.js`);

/**
 * Returns a string with path of configuration file.
 * Check if set by environment variable MM_CONFIG_FILE
 * @returns {string} path and filename of the config file
 */
function getConfigFile () {
	// FIXME: This function should be in core. Do you want refactor me ;) ?, be good!
	return path.resolve(process.env.MM_CONFIG_FILE || `${rootPath}/config/config.js`);
}

/**
 * Checks the config file using eslint.
 */
function checkConfigFile () {
	const configFileName = getConfigFile();

	// Check if file is present
	if (fs.existsSync(configFileName) === false) {
		Log.error(`File not found: ${configFileName}`);
		throw new Error("No config file present!");
	}

	// Check permission
	try {
		fs.accessSync(configFileName, fs.F_OK);
	} catch (e) {
		Log.error(e);
		throw new Error("No permission to access config file!");
	}

	// Validate syntax of the configuration file.
	Log.info("Checking file... ", configFileName);

	// I'm not sure if all ever is utf-8
	const configFile = fs.readFileSync(configFileName, "utf-8");

	// Explicitly tell linter that he might encounter es6 syntax ("let config = {...}")
	const errors = linter.verify(configFile, {
		env: {
			es6: true
		}
	});

	if (errors.length === 0) {
		Log.info(colors.green("Your configuration file doesn't contain syntax errors :)"));
	} else {
		Log.error(colors.red("Your configuration file contains syntax errors :("));

		for (const error of errors) {
			Log.error(`Line ${error.line} column ${error.column}: ${error.message}`);
		}
		return;
	}

	Log.info("Checking modules structure configuration... ");

	// Make Ajv schema confguration of modules config
	// only scan "module" and "position"
	const schema = {
		type: "object",
		properties: {
			modules: {
				type: "array",
				items: {
					type: "object",
					properties: {
						module: {
							type: "string"
						},
						position: {
							type: "string",
							enum: [
								"top_bar",
								"top_left",
								"top_center",
								"top_right",
								"upper_third",
								"middle_center",
								"lower_third",
								"bottom_left",
								"bottom_center",
								"bottom_right",
								"bottom_bar",
								"fullscreen_above",
								"fullscreen_below"
							]
						}
					},
					required: ["module"]
				}
			}
		}
	};

	// scan all modules
	const validate = ajv.compile(schema);
	const data = require(configFileName);

	const valid = validate(data);
	if (!valid) {
		let module = validate.errors[0].instancePath.split("/")[2];
		let position = validate.errors[0].instancePath.split("/")[3];

		Log.error(colors.red("This module configuration contains errors:"));
		Log.error(data.modules[module]);
		if (position) {
			Log.error(colors.red(`${position}: ${validate.errors[0].message}`));
			Log.error(validate.errors[0].params.allowedValues);
		} else {
			Log.error(colors.red(validate.errors[0].message));
		}
	} else {
		Log.info(colors.green("Your modules structure configuration doesn't contain errors :)"));
	}
}

checkConfigFile();
