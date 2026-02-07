const fs = require("node:fs");
const { loadEnvFile } = require("node:process");

const modulePositions = []; // will get list from index.html
const regionRegEx = /"region ([^"]*)/i;
const indexFileName = "index.html";
const discoveredPositionsJSFilename = "js/positions.js";

const { styleText } = require("node:util");
const Log = require("logger");
const Ajv = require("ajv");
const globals = require("globals");
const { Linter } = require("eslint");
const { getConfigFilePath } = require("#server_functions");

const linter = new Linter({ configType: "flat" });
const ajv = new Ajv();

const requireFromString = (src) => {
	const m = new module.constructor();
	m._compile(src, "");
	return m.exports;
};

// return all available module positions
const getAvailableModulePositions = () => {
	return modulePositions;
};

// return if position is on modulePositions Array (true/false)
const moduleHasValidPosition = (position) => {
	if (getAvailableModulePositions().indexOf(position) === -1) return false;
	return true;
};

const getModulePositions = () => {
	// if not already discovered
	if (modulePositions.length === 0) {
		// get the lines of the index.html
		const lines = fs.readFileSync(indexFileName).toString().split("\n");
		// loop thru the lines
		lines.forEach((line) => {
			// run the regex on each line
			const results = regionRegEx.exec(line);
			// if the regex returned something
			if (results && results.length > 0) {
				// get the position parts and replace space with underscore
				const positionName = results[1].replace(" ", "_");
				// add it to the list only if not already present (avoid duplicates)
				if (!modulePositions.includes(positionName)) {
					modulePositions.push(positionName);
				}
			}
		});
		try {
			fs.writeFileSync(discoveredPositionsJSFilename, `const modulePositions=${JSON.stringify(modulePositions)}`);
		}
		catch (error) {
			Log.error("unable to write js/positions.js with the discovered module positions\nmake the MagicMirror/js folder writeable by the user starting MagicMirror");
		}
	}
	// return the list to the caller
	return modulePositions;
};

/**
 * Checks the config for deprecated options and throws a warning in the logs
 * if it encounters one option from the deprecated.js list
 * @param {object} userConfig The user config
 */
const checkDeprecatedOptions = (userConfig) => {
	const deprecated = require(`${global.root_path}/js/deprecated`);

	// check for deprecated core options
	const deprecatedOptions = deprecated.configs;
	const usedDeprecated = deprecatedOptions.filter((option) => userConfig.hasOwnProperty(option));
	if (usedDeprecated.length > 0) {
		Log.warn(`WARNING! Your config is using deprecated option(s): ${usedDeprecated.join(", ")}. Check README and Documentation for more up-to-date ways of getting the same functionality.`);
	}

	// check for deprecated module options
	for (const element of userConfig.modules) {
		if (deprecated[element.module] !== undefined && element.config !== undefined) {
			const deprecatedModuleOptions = deprecated[element.module];
			const usedDeprecatedModuleOptions = deprecatedModuleOptions.filter((option) => element.config.hasOwnProperty(option));
			if (usedDeprecatedModuleOptions.length > 0) {
				Log.warn(`WARNING! Your config for module ${element.module} is using deprecated option(s): ${usedDeprecatedModuleOptions.join(", ")}. Check README and Documentation for more up-to-date ways of getting the same functionality.`);
			}
		}
	}
};

/**
 * Loads the config file. Combines it with the defaults and returns the config
 * @returns {object} an object holding full and redacted config
 */
const loadConfig = () => {
	Log.log("Loading config ...");
	const defaults = require(`${__dirname}/defaults`);
	if (global.mmTestMode) {
		// if we are running in test mode
		defaults.address = "0.0.0.0";
	}

	// For this check proposed to TestSuite
	// https://forum.magicmirror.builders/topic/1456/test-suite-for-magicmirror/8
	const configFilename = getConfigFilePath();
	let templateFile = `${configFilename}.template`;

	// check if templateFile exists
	try {
		fs.accessSync(templateFile, fs.constants.F_OK);
		Log.warn("config.js.template files are deprecated and not used anymore. You can use variables inside config.js so copy the template file content into config.js if needed.");
	} catch (error) {
		// no action
	}

	// check if config.env exists
	const configEnvFile = `${configFilename.substr(0, configFilename.lastIndexOf("."))}.env`;
	try {
		if (fs.existsSync(configEnvFile)) {
			// load content into process.env
			loadEnvFile(configEnvFile);
		}
	} catch (error) {
		Log.log(`${configEnvFile} does not exist. ${error.message}`);
	}

	// Load config.js and catch errors if not accessible
	try {
		let configContent = fs.readFileSync(configFilename, "utf-8");
		const hideConfigSecrets = configContent.match(/^\s*hideConfigSecrets: true.*$/m);
		let configContentFull = configContent;
		let configContentRedacted = hideConfigSecrets ? configContent : undefined;
		Object.keys(process.env).forEach((env) => {
			configContentFull = configContentFull.replaceAll(`\${${env}}`, process.env[env]);
			if (hideConfigSecrets) {
				if (env.startsWith("SECRET_")) {
					configContentRedacted = configContentRedacted.replaceAll(`"\${${env}}"`, `"**${env}**"`);
					configContentRedacted = configContentRedacted.replaceAll(`\${${env}}`, `**${env}**`);
				} else {
					configContentRedacted = configContentRedacted.replaceAll(`\${${env}}`, process.env[env]);
				}
			}
		});
		configContentRedacted = configContentRedacted ? configContentRedacted : configContentFull;
		const configObj = {
			configFilename: configFilename,
			configContentFull: configContentFull,
			configContentRedacted: configContentRedacted,
			redactedConf: Object.assign({}, defaults, requireFromString(configContentRedacted)),
			fullConf: Object.assign({}, defaults, requireFromString(configContentFull))
		};

		if (Object.keys(configObj.fullConf).length === 0) {
			Log.error("WARNING! Config file appears empty, maybe missing module.exports last line?");
		}
		checkDeprecatedOptions(configObj.fullConf);

		try {
			const cfg = `let config = { basePath: "${configObj.fullConf.basePath}"};`;
			fs.writeFileSync(`${global.root_path}/config/basepath.js`, cfg, "utf-8");
		} catch (error) {
			Log.error(`Could not write config/basepath.js file: ${error.message}`);
		}

		return configObj;

	} catch (error) {
		if (error.code === "ENOENT") {
			Log.error(`Could not find config file: ${configFilename}`);
		} else if (error.code === "EACCES") {
			Log.error(`No permission to read config file: ${configFilename}`);
		} else {
			Log.error(`Cannot access config file: ${configFilename}\n${error.message}`);
		}
		process.exit(1);
	}
	return {};
};

/**
 * Checks the config file using eslint.
 * @param {object} configObject the configuration object
 */
const checkConfigFile = (configObject) => {
	let configObj = configObject;
	if (!configObj) configObj = loadConfig();
	const configFileName = configObj.configFilename;

	// Validate syntax of the configuration file.
	Log.info(`Checking config file ${configFileName} ...`);

	// I'm not sure if all ever is utf-8
	const configFile = configObj.configContentFull;

	const errors = linter.verify(
		configFile,
		{
			languageOptions: {
				ecmaVersion: "latest",
				globals: {
					...globals.browser,
					...globals.node
				}
			},
			rules: {
				"no-sparse-arrays": "error",
				"no-undef": "error"
			}
		},
		configFileName
	);

	if (errors.length === 0) {
		Log.info(styleText("green", "Your configuration file doesn't contain syntax errors :)"));
		validateModulePositions(configObj.fullConf);
	} else {
		let errorMessage = "Your configuration file contains syntax errors :(";

		for (const error of errors) {
			errorMessage += `\nLine ${error.line} column ${error.column}: ${error.message}`;
		}
		Log.error(errorMessage);
		process.exit(1);
	}
};

/**
 *
 * @param {string} data - The content of the configuration file to validate.
 */
const validateModulePositions = (data) => {
	Log.info("Checking modules structure configuration ...");

	const positionList = getModulePositions();

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
							type: "string"
						}
					},
					required: ["module"]
				}
			}
		}
	};

	// Scan all modules
	const validate = ajv.compile(schema);

	const valid = validate(data);
	if (valid) {
		Log.info(styleText("green", "Your modules structure configuration doesn't contain errors :)"));

		// Check for unknown positions (warning only, not an error)
		if (data.modules) {
			for (const [index, module] of data.modules.entries()) {
				if (module.position && !positionList.includes(module.position)) {
					Log.warn(`Module ${index} ("${module.module}") uses unknown position: "${module.position}"`);
					Log.warn(`Known positions are: ${positionList.join(", ")}`);
				}
			}
		}
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
		process.exit(1);
	}
};

module.exports = { loadConfig, getModulePositions, moduleHasValidPosition, getAvailableModulePositions, checkConfigFile };
