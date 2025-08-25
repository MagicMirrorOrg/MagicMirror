const path = require("node:path");

const rootPath = path.resolve(`${__dirname}/../`);
const Log = require(`${rootPath}/js/logger.js`);
const os = require("node:os");
const fs = require("node:fs");
const si = require("systeminformation");

const modulePositions = []; // will get list from index.html
const regionRegEx = /"region ([^"]*)/i;
const indexFileName = "index.html";
const discoveredPositionsJSFilename = "js/positions.js";

module.exports = {

	async logSystemInformation (mirrorVersion) {
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
				`- SYSTEM:   manufacturer: ${system.manufacturer}; model: ${system.model}; virtual: ${system.virtual}; MM: ${mirrorVersion}`,
				`- OS:       platform: ${osInfo.platform}; distro: ${osInfo.distro}; release: ${osInfo.release}; arch: ${osInfo.arch}; kernel: ${versions.kernel}`,
				`- VERSIONS: electron: ${process.versions.electron}; used node: ${usedNodeVersion}; installed node: ${installedNodeVersion}; npm: ${versions.npm}; pm2: ${versions.pm2}`,
				`- ENV:      XDG_SESSION_TYPE: ${process.env.XDG_SESSION_TYPE}; MM_CONFIG_FILE: ${process.env.MM_CONFIG_FILE}`,
				`            WAYLAND_DISPLAY:  ${process.env.WAYLAND_DISPLAY}; DISPLAY: ${process.env.DISPLAY}; ELECTRON_ENABLE_GPU: ${process.env.ELECTRON_ENABLE_GPU}`,
				`- RAM:      total: ${totalRam} MB; free: ${freeRam} MB; used: ${usedRam} MB`,
				`- OTHERS:   uptime: ${Math.floor(os.uptime() / 60)} minutes; timeZone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
			].join("\n");
			Log.info(systemDataString);

			// Return is currently only for jest
			return systemDataString;
		} catch (error) {
			Log.error(error);
		}
	},

	// return all available module positions
	getAvailableModulePositions () {
		return modulePositions;
	},

	// return if position is on modulePositions Array (true/false)
	moduleHasValidPosition (position) {
		if (this.getAvailableModulePositions().indexOf(position) === -1) return false;
		return true;
	},

	getModulePositions () {
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
					// add it to the list
					modulePositions.push(positionName);
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
	}
};
