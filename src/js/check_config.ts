// Ensure internal require aliases (e.g., "logger") resolve when this file is run as a standalone script
require("./alias-resolver");

const path = require("node:path");
const Log = require("logger");

const rootPath = path.resolve(`${__dirname}/../`);
const Utils = require(`${rootPath}/js/utils.js`);

try {
	Utils.checkConfigFile();
} catch (error) {
	const err = error as any;
	const message = err && err.message ? err.message : err;
	Log.error(`Unexpected error: ${message}`);
	process.exit(1);
}

export {};
