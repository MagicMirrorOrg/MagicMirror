const fs = require("node:fs");
const path = require("node:path");
const Log = require("logger");

const startUp = new Date();

/**
 * Gets the config.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
function getConfig (req, res) {
	res.send(config);
}

/**
 * Gets the startup time.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
function getStartup (req, res) {
	res.send(startUp);
}

/**
 * A method that forwards HTTP Get-methods to the internet to avoid CORS-errors.
 *
 * Example input request url: /cors?sendheaders=header1:value1,header2:value2&expectedheaders=header1,header2&url=http://www.test.com/path?param1=value1
 *
 * Only the url-param of the input request url is required. It must be the last parameter.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
async function cors (req, res) {
	try {
		const urlRegEx = "url=(.+?)$";
		let url;

		const match = new RegExp(urlRegEx, "g").exec(req.url);
		if (!match) {
			url = `invalid url: ${req.url}`;
			Log.error(url);
			res.send(url);
		} else {
			url = match[1];

			const headersToSend = getHeadersToSend(req.url);
			const expectedReceivedHeaders = geExpectedReceivedHeaders(req.url);

			Log.log(`cors url: ${url}`);
			const response = await fetch(url, { headers: headersToSend });

			for (const header of expectedReceivedHeaders) {
				const headerValue = response.headers.get(header);
				if (header) res.set(header, headerValue);
			}
			const data = await response.text();
			res.send(data);
		}
	} catch (error) {
		Log.error(error);
		res.send(error);
	}
}

/**
 * Gets headers and values to attach to the web request.
 * @param {string} url - The url containing the headers and values to send.
 * @returns {object} An object specifying name and value of the headers.
 */
function getHeadersToSend (url) {
	const headersToSend = { "User-Agent": `Mozilla/5.0 MagicMirror/${global.version}` };
	const headersToSendMatch = new RegExp("sendheaders=(.+?)(&|$)", "g").exec(url);
	if (headersToSendMatch) {
		const headers = headersToSendMatch[1].split(",");
		for (const header of headers) {
			const keyValue = header.split(":");
			if (keyValue.length !== 2) {
				throw new Error(`Invalid format for header ${header}`);
			}
			headersToSend[keyValue[0]] = decodeURIComponent(keyValue[1]);
		}
	}
	return headersToSend;
}

/**
 * Gets the headers expected from the response.
 * @param {string} url - The url containing the expected headers from the response.
 * @returns {string[]} headers - The name of the expected headers.
 */
function geExpectedReceivedHeaders (url) {
	const expectedReceivedHeaders = ["Content-Type"];
	const expectedReceivedHeadersMatch = new RegExp("expectedheaders=(.+?)(&|$)", "g").exec(url);
	if (expectedReceivedHeadersMatch) {
		const headers = expectedReceivedHeadersMatch[1].split(",");
		for (const header of headers) {
			expectedReceivedHeaders.push(header);
		}
	}
	return expectedReceivedHeaders;
}

/**
 * Gets the HTML to display the magic mirror.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
function getHtml (req, res) {
	let html = fs.readFileSync(path.resolve(`${global.root_path}/index.html`), { encoding: "utf8" });
	html = html.replace("#VERSION#", global.version);
	html = html.replace("#TESTMODE#", global.mmTestMode);

	let configFile = "config/config.js";
	if (typeof global.configuration_file !== "undefined") {
		configFile = global.configuration_file;
	}
	html = html.replace("#CONFIG_FILE#", configFile);

	res.send(html);
}

/**
 * Gets the MagicMirror version.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
function getVersion (req, res) {
	res.send(global.version);
}

/**
 * Gets environment variables needed in the browser.
 * @returns {object} environment variables key: values
 */
function getEnvVarsAsObj () {
	const obj = { modulesDir: `${config.foreignModulesDir}`, customCss: `${config.customCss}` };
	if (process.env.MM_MODULES_DIR) {
		obj.modulesDir = process.env.MM_MODULES_DIR.replace(`${global.root_path}/`, "");
	}
	if (process.env.MM_CUSTOMCSS_FILE) {
		obj.customCss = process.env.MM_CUSTOMCSS_FILE.replace(`${global.root_path}/`, "");
	}

	return obj;
}

/**
 * Gets environment variables needed in the browser.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
function getEnvVars (req, res) {
	const obj = getEnvVarsAsObj();
	res.send(obj);
}

module.exports = { cors, getConfig, getHtml, getVersion, getStartup, getEnvVars, getEnvVarsAsObj };
