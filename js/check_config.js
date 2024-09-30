const path = require("node:path");
const fs = require("node:fs");
const Ajv = require("ajv");
const colors = require("ansis");
const globals = require("globals");
const { Linter } = require("eslint");

const rootPath = path.resolve(`${__dirname}/../`);
const Log = require(`${rootPath}/js/logger.js`);
const Utils = require(`${rootPath}/js/utils.js`);

const linter = new Linter({ configType: "flat" });
const ajv = new Ajv();

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
		throw new Error(`File not found: ${configFileName}\nNo config file present!`);
	}

	// Check permission
	try {
		fs.accessSync(configFileName, fs.F_OK);
	} catch (error) {
		throw new Error(`${error}\nNo permission to access config file!`);
	}

	// Validate syntax of the configuration file.
	Log.info(`Checking config file ${configFileName} ...`);

	// I'm not sure if all ever is utf-8
	const configFile = fs.readFileSync(configFileName, "utf-8");

	const errors = linter.verify(
		configFile,
		{
			languageOptions: {
				ecmaVersion: "latest",
				globals: {
					...globals.node
				}
			}
		},
		configFileName
	);

	if (errors.length === 0) {
		Log.info(colors.green("Your configuration file doesn't contain syntax errors :)"));
		validateModulePositions(configFileName);
	} else {
		let errorMessage = "Your configuration file contains syntax errors :(";

		for (const error of errors) {
			errorMessage += `\nLine ${error.line} column ${error.column}: ${error.message}`;
		}
		throw new Error(errorMessage);
	}
}

function validateModulePositions (configFileName) {
	Log.info("Checking modules structure configuration ...");

	const positionList = Utils.getModulePositions();

	// Make Ajv schema configuration of modules config
	// Only scan "module" and "position"
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
							enum: positionList
						}
					},
					required: ["module"]
				}
			}
		}
	};

	// Scan all modules
	const validate = ajv.compile(schema);
	const data = require(configFileName);

	const valid = validate(data);
	if (valid) {
		Log.info(colors.green("Your modules structure configuration doesn't contain errors :)"));
	} else {
		const module = validate.errors[0].instancePath.split("/")[2];
		const position = validate.errors[0].instancePath.split("/")[3];
		let errorMessage = "This module configuration contains errors:";
		errorMessage += `\n${JSON.stringify(data.modules[module], null, 2)}`;
		if (position) {
			errorMessage += `\n${position}: ${validate.errors[0].message}`;
			errorMessage += `\n${JSON.stringify(validate.errors[0].params.allowedValues, null, 2).slice(1, -1)}`;
		} else {
			errorMessage += validate.errors[0].message;
		}
		Log.error(errorMessage);
	}
}

try {
	checkConfigFile();
} catch (error) {
	Log.error(error.message);
	process.exit(1);
}
