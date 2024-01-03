/* MagicMirror²
 * Utils
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
const colors = require("colors/safe");
const Log = require("logger");
const si = require("systeminformation");

try {
	global.electronVersion = require(`${__dirname}/../node_modules/electron/package.json`).version;
} catch (error) {
	Log.error(`Can't find electron. Have you performed 'npm run install-mm'? ${error}`);
}

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
			let systemDataString = "The following lines provide information about your system and may be of interest when troubleshooting.";
			systemDataString += `\n ### SYSTEM:   manufacturer: ${staticData["system"]["manufacturer"]}; model: ${staticData["system"]["model"]}; raspberry: ${staticData["system"]["raspberry"]}; virtual: ${staticData["system"]["virtual"]}`;
			systemDataString += `\n ### OS:       platform: ${staticData["os"]["platform"]}; distro: ${staticData["os"]["distro"]}; release: ${staticData["os"]["release"]}`;
			systemDataString += `\n ### VERSIONS: MagicMirror: ${global.version}; electron: ${global.electronVersion}; kernel: ${staticData["versions"]["kernel"]}; node: ${staticData["versions"]["node"]}; npm: ${staticData["versions"]["npm"]}; pm2: ${staticData["versions"]["pm2"]}; docker: ${staticData["versions"]["docker"]}`;
			if (typeof staticData["dockerInfo"] !== "undefined") systemDataString += `\n ### DOCKER:   containers: ${staticData["dockerInfo"]["containers"]}; operatingSystem: ${staticData["dockerInfo"]["operatingSystem"]}; osType: ${staticData["versions"]["osType"]}; architecture: ${staticData["versions"]["architecture"]}; serverVersion: ${staticData["versions"]["serverVersion"]}`;
			Log.info(systemDataString);
		} catch (e) {
			Log.error(e);
		}
	}
};
