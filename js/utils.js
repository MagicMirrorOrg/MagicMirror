const fs = require("node:fs");
const Log = require("logger");

const modulePositions = []; // will get list from index.html
const regionRegEx = /"region ([^"]*)/i;
const indexFileName = "index.html";
const discoveredPositionsJSFilename = "js/positions.js";

module.exports = {

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
	}
};
