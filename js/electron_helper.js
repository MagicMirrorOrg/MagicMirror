const Log = require("./logger");

/**
 * Applies Electron command-line switches (defaults + from config).
 * @param {object} commandLine Electron commandLine API
 * @param {Array<string|object>} [electronSwitches] User-configured switches
 */
function applyElectronSwitches (commandLine, electronSwitches) {
	commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
	Log.debug("Activated default switch: autoplay-policy=no-user-gesture-required");

	if (electronSwitches === undefined) return;
	if (!Array.isArray(electronSwitches)) {
		Log.error(`electronSwitches must be an array of strings or objects, got: ${JSON.stringify(electronSwitches)}`);
		return;
	}

	for (const sw of electronSwitches) {
		if (typeof sw === "string") {
			commandLine.appendSwitch(sw);
			Log.debug(`Activated switch: ${sw}`);
		} else if (sw && typeof sw === "object" && !Array.isArray(sw)) {
			for (const [name, value] of Object.entries(sw)) {
				commandLine.appendSwitch(name, String(value));
				Log.debug(`Activated switch: ${name}=${value}`);
			}
		} else {
			Log.error(`Invalid electronSwitches entry: ${JSON.stringify(sw)}`);
		}
	}
}

module.exports = { applyElectronSwitches };
