/* MagicMirror²
 * Utils
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
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
			const staticData = await si.getStaticData();
			let systemDataString = "System information:";
			systemDataString += `\n ### SYSTEM:   manufacturer: ${staticData["system"]["manufacturer"]}; model: ${staticData["system"]["model"]}; raspberry: ${staticData["system"]["raspberry"]}; virtual: ${staticData["system"]["virtual"]}`;
			systemDataString += `\n ### OS:       platform: ${staticData["os"]["platform"]}; distro: ${staticData["os"]["distro"]}; release: ${staticData["os"]["release"]}; arch: ${staticData["os"]["arch"]}; kernel: ${staticData["versions"]["kernel"]}`;
			systemDataString += `\n ### VERSIONS: electron: ${process.versions.electron}; node: ${staticData["versions"]["node"]}; npm: ${staticData["versions"]["npm"]}; pm2: ${staticData["versions"]["pm2"]}; docker: ${staticData["versions"]["docker"]}`;
			if (typeof staticData["dockerInfo"] !== "undefined") systemDataString += `\n ### DOCKER:   containers: ${staticData["dockerInfo"]["containers"]}; operatingSystem: ${staticData["dockerInfo"]["operatingSystem"]}; osType: ${staticData["versions"]["osType"]}; architecture: ${staticData["versions"]["architecture"]}; serverVersion: ${staticData["versions"]["serverVersion"]}`;
			systemDataString += `\n ### OTHER:    timeZone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
			Log.info(systemDataString);
		} catch (e) {
			Log.error(e);
		}
	}
};
