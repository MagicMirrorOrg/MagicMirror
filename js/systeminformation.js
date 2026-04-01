const os = require("node:os");
const si = require("systeminformation");
// needed with relative path because logSystemInformation is called in an own process in app.js:
const mmVersion = require("../package").version;
const Log = require("./logger");

const logSystemInformation = async () => {
	try {
		const system = await si.system();
		const osInfo = await si.osInfo();
		const versions = await si.versions();

		const usedNodeVersion = process.version.replace("v", "");
		const installedNodeVersion = versions.node;
		const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
		const freeRam = (os.freemem() / 1024 / 1024).toFixed(2);
		const usedRam = ((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(2);

		let systemDataString = [
			"\n####  System Information  ####",
			`- SYSTEM:   manufacturer: ${system.manufacturer}; model: ${system.model}; virtual: ${system.virtual}; MM: v${mmVersion}`,
			`- OS:       platform: ${osInfo.platform}; distro: ${osInfo.distro}; release: ${osInfo.release}; arch: ${osInfo.arch}; kernel: ${versions.kernel}`,
			`- VERSIONS: electron: ${process.env.ELECTRON_VERSION}; used node: ${usedNodeVersion}; installed node: ${installedNodeVersion}; npm: ${versions.npm}; pm2: ${versions.pm2}`,
			`- ENV:      XDG_SESSION_TYPE: ${process.env.XDG_SESSION_TYPE}; MM_CONFIG_FILE: ${process.env.MM_CONFIG_FILE}`,
			`            WAYLAND_DISPLAY:  ${process.env.WAYLAND_DISPLAY}; DISPLAY: ${process.env.DISPLAY}; ELECTRON_ENABLE_GPU: ${process.env.ELECTRON_ENABLE_GPU}`,
			`- RAM:      total: ${totalRam} MB; free: ${freeRam} MB; used: ${usedRam} MB`,
			`- OTHERS:   uptime: ${Math.floor(os.uptime() / 60)} minutes; timeZone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
		].join("\n");
		Log.info(systemDataString);

		// Return is currently only for tests
		return systemDataString;
	} catch (error) {
		Log.error(error);
	}
};

module.exports = logSystemInformation;
logSystemInformation();
