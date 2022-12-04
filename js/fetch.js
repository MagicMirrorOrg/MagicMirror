/**
 * fetch
 *
 * @param {string} url to be fetched
 * @param {object} options object e.g. for headers
 * @class
 */
async function fetch(url, options) {
	const nodeVersion = process.version.match(/^v(\d+)\.*/)[1];
	if (nodeVersion >= 18) {
		// node version >= 18
		return global.fetch(url, options);
	} else {
		// node version < 18
		const nodefetch = require("node-fetch");
		return nodefetch(url, options);
	}
}

module.exports = fetch;
