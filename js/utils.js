const execSync = require("node:child_process").execSync;
const Log = require("logger");
const si = require("systeminformation");

module.exports = {

	async logSystemInformation  () {
		try {
			let installedNodeVersion = execSync("node -v", { encoding: "utf-8" }).replace("v", "").replace(/(?:\r\n|\r|\n)/g, "");

			const staticData = await si.get({
				system: "manufacturer, model, raspberry, virtual",
				osInfo: "platform, distro, release, arch",
				versions: "kernel, node, npm, pm2"
			});
			let systemDataString = "System information:";
			systemDataString += `\n### SYSTEM:   manufacturer: ${staticData["system"]["manufacturer"]}; model: ${staticData["system"]["model"]}; raspberry: ${staticData["system"]["raspberry"]}; virtual: ${staticData["system"]["virtual"]}`;
			systemDataString += `\n### OS:       platform: ${staticData["osInfo"]["platform"]}; distro: ${staticData["osInfo"]["distro"]}; release: ${staticData["osInfo"]["release"]}; arch: ${staticData["osInfo"]["arch"]}; kernel: ${staticData["versions"]["kernel"]}`;
			systemDataString += `\n### VERSIONS: electron: ${process.versions.electron}; used node: ${staticData["versions"]["node"]}; installed node: ${installedNodeVersion}; npm: ${staticData["versions"]["npm"]}; pm2: ${staticData["versions"]["pm2"]}`;
			systemDataString += `\n### OTHER:    timeZone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}; ELECTRON_ENABLE_GPU: ${process.env.ELECTRON_ENABLE_GPU}`;
			Log.info(systemDataString);

			// Return is currently only for jest
			return systemDataString;
		} catch (e) {
			Log.error(e);
		}
	}
};
