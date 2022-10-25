const fetch = require("./fetch");
const fs = require("fs");
const path = require("path");
const Log = require("logger");

/**
 * Gets the config.
 *
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
function getConfig(req, res) {
	res.send(config);
}

/**
 * A method that forewards HTTP Get-methods to the internet to avoid CORS-errors.
 *
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
async function cors(req, res) {
	try {
		const reg = "^/cors.+url=(.*)";
		let url = "";

		let match = new RegExp(reg, "g").exec(req.url);
		if (!match) {
			url = "invalid url: " + req.url;
			Log.error(url);
			res.send(url);
		} else {
			url = match[1];
			Log.log("cors url: " + url);
			const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 MagicMirror/" + global.version } });
			const header = response.headers.get("Content-Type");
			const data = await response.text();
			if (header) res.set("Content-Type", header);
			res.send(data);
		}
	} catch (error) {
		Log.error(error);
		res.send(error);
	}
}

/**
 * Gets the HTML to display the magic mirror.
 *
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
function getHtml(req, res) {
	let html = fs.readFileSync(path.resolve(`${global.root_path}/index.html`), { encoding: "utf8" });
	html = html.replace("#VERSION#", global.version);

	let configFile = "config/config.js";
	if (typeof global.configuration_file !== "undefined") {
		configFile = global.configuration_file;
	}
	html = html.replace("#CONFIG_FILE#", configFile);

	res.send(html);
}

/**
 * Gets the MacigMirror version.
 *
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
function getVersion(req, res) {
	res.send(global.version);
}

module.exports = { cors, getConfig, getHtml, getVersion };
