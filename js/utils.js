/* MagicMirror²
 * Utils
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
const execSync = require("node:child_process").execSync;
const colors = require("colors/safe");
const Log = require("logger");
const si = require("systeminformation");

module.exports = {
	colors: {
		warn: colors.yellow,
		error: colors.red,
		info: colors.blue,
		pass: colors.green
	},

	async logSystemInformation  () {
		try {
			let installedNodeVersion = execSync("node -v", { encoding: "utf-8" }).replace("v", "").replace(/(?:\r\n|\r|\n)/g, "");
			const staticData = await si.getStaticData();
			let systemDataString = "System information:";
			systemDataString += `\n### SYSTEM:   manufacturer: ${staticData["system"]["manufacturer"]}; model: ${staticData["system"]["model"]}; raspberry: ${staticData["system"]["raspberry"]}; virtual: ${staticData["system"]["virtual"]}`;
			systemDataString += `\n### OS:       platform: ${staticData["os"]["platform"]}; distro: ${staticData["os"]["distro"]}; release: ${staticData["os"]["release"]}; arch: ${staticData["os"]["arch"]}; kernel: ${staticData["versions"]["kernel"]}`;
			systemDataString += `\n### VERSIONS: electron: ${process.versions.electron}; used node: ${staticData["versions"]["node"]}; installed node: ${installedNodeVersion}; npm: ${staticData["versions"]["npm"]}; pm2: ${staticData["versions"]["pm2"]}`;
			systemDataString += `\n### OTHER:    timeZone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}; ELECTRON_ENABLE_GPU: ${process.env.ELECTRON_ENABLE_GPU}`;
			Log.info(systemDataString);
		} catch (e) {
			Log.error(e);
		}
	}
};
