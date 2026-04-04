const dns = require("node:dns");
const fs = require("node:fs");
const path = require("node:path");
const ipaddr = require("ipaddr.js");
const { fetch, Agent } = require("undici");
const Log = require("logger");

const startUp = new Date();

/**
 * Gets the startup time.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
function getStartup (req, res) {
	res.send(startUp);
}

/**
 * A method that replaces the secret placeholders `**SECRET_ABC**` with the environment variable SECRET_ABC
 * @param {string} input - the input string
 * @returns {string} the input with real variable content
 */
function replaceSecretPlaceholder (input) {
	return input.replaceAll(/\*\*(SECRET_[^*]+)\*\*/g, (match, group) => {
		return process.env[group];
	});
}

/**
 * A method that forwards HTTP Get-methods to the internet to avoid CORS-errors.
 *
 * Example input request url: /cors?sendheaders=header1:value1,header2:value2&expectedheaders=header1,header2&url=http://www.test.com/path?param1=value1
 *
 * Only the url-param of the input request url is required. It must be the last parameter.
 * @param {Request} req - the request
 * @param {Response} res - the result
 * @returns {Promise<void>} A promise that resolves when the response is sent
 */
async function cors (req, res) {
	if (global.config.cors === "disabled") {
		Log.error("CORS is disabled, you need to enable it in `config.js` by setting `cors` to `allowAll` or `allowWhitelist`");
		return res.status(403).json({ error: "CORS proxy is disabled" });
	}
	let url;
	try {
		const urlRegEx = "url=(.+?)$";

		const match = new RegExp(urlRegEx, "g").exec(req.url);
		if (!match) {
			url = `invalid url: ${req.url}`;
			Log.error(url);
			return res.status(400).send(url);
		} else {
			url = match[1];
			if (typeof global.config !== "undefined") {
				if (config.hideConfigSecrets) {
					url = replaceSecretPlaceholder(url);
				}
			}

			// Validate protocol before attempting connection (non-http/https are never allowed)
			let parsed;
			try {
				parsed = new URL(url);
			} catch {
				Log.warn(`SSRF blocked (invalid URL): ${url}`);
				return res.status(403).json({ error: "Forbidden: private or reserved addresses are not allowed" });
			}
			if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
				Log.warn(`SSRF blocked (protocol): ${url}`);
				return res.status(403).json({ error: "Forbidden: private or reserved addresses are not allowed" });
			}

			// Block localhost by hostname before even creating the dispatcher (no DNS needed).
			if (parsed.hostname.toLowerCase() === "localhost") {
				Log.warn(`SSRF blocked (localhost): ${url}`);
				return res.status(403).json({ error: "Forbidden: private or reserved addresses are not allowed" });
			}

			// Whitelist check: if enabled, only allow explicitly listed domains
			if (global.config.cors === "allowWhitelist" && !global.config.corsDomainWhitelist.includes(parsed.hostname.toLowerCase())) {
				Log.warn(`CORS blocked (not in whitelist): ${url}`);
				return res.status(403).json({ error: "Forbidden: domain not in corsDomainWhitelist" });
			}

			const headersToSend = getHeadersToSend(req.url);
			const expectedReceivedHeaders = geExpectedReceivedHeaders(req.url);
			Log.log(`cors url: ${url}`);

			// Resolve DNS once and validate the IP. The validated IP is then pinned
			// for the actual connection so fetch() cannot re-resolve to a different
			// address. This prevents DNS rebinding / TOCTOU attacks (GHSA-xhvw-r95j-xm4v).
			const { address, family } = await dns.promises.lookup(parsed.hostname);
			if (ipaddr.process(address).range() !== "unicast") {
				Log.warn(`SSRF blocked: ${url}`);
				return res.status(403).json({ error: "Forbidden: private or reserved addresses are not allowed" });
			}

			// Pin the validated IP — fetch() reuses it instead of doing its own DNS lookup
			const dispatcher = new Agent({
				connect: {
					lookup: (_h, _o, cb) => {
						const addresses = [{ address: address, family: family }];
						process.nextTick(() => cb(null, addresses));
					}
				}
			});

			const response = await fetch(url, { dispatcher, headers: headersToSend });
			if (response.ok) {
				for (const header of expectedReceivedHeaders) {
					const headerValue = response.headers.get(header);
					if (header) res.set(header, headerValue);
				}
				const arrayBuffer = await response.arrayBuffer();
				res.send(Buffer.from(arrayBuffer));
			} else {
				throw new Error(`Response status: ${response.status}`);
			}
		}
	} catch (error) {
		if (process.env.mmTestMode !== "true") {
			Log.error(`Error in CORS request: ${error}`);
		}
		res.status(500).json({ error: error.message });
	}
}

/**
 * Gets headers and values to attach to the web request.
 * @param {string} url - The url containing the headers and values to send.
 * @returns {object} An object specifying name and value of the headers.
 */
function getHeadersToSend (url) {
	const headersToSend = { "User-Agent": getUserAgent() };
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
 * Gets the preferred `User-Agent`
 * @returns {string} `User-Agent` to be used
 */
function getUserAgent () {
	const defaultUserAgent = `Mozilla/5.0 (Node.js ${Number(process.version.match(/^v(\d+\.\d+)/)[1])}) MagicMirror/${global.version}`;

	if (typeof global.config === "undefined") {
		return defaultUserAgent;
	}

	switch (typeof global.config.userAgent) {
		case "function":
			return global.config.userAgent();
		case "string":
			return global.config.userAgent;
		default:
			return defaultUserAgent;
	}
}

/**
 * Gets environment variables needed in the browser.
 * @returns {object} environment variables key: values
 */
function getEnvVarsAsObj () {
	const obj = { modulesDir: `${global.config.foreignModulesDir}`, defaultModulesDir: `${global.config.defaultModulesDir}`, customCss: `${global.config.customCss}` };
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

/**
 * Get the config file path from environment or default location
 * @returns {string} The absolute config file path
 */
function getConfigFilePath () {
	// Ensure root_path is set (for standalone contexts like watcher)
	if (!global.root_path) {
		global.root_path = path.resolve(`${__dirname}/../`);
	}

	// Check environment variable if global not set
	if (!global.configuration_file && process.env.MM_CONFIG_FILE) {
		global.configuration_file = process.env.MM_CONFIG_FILE;
	}

	return path.resolve(global.configuration_file || `${global.root_path}/config/config.js`);
}

module.exports = { cors, getHtml, getVersion, getStartup, getEnvVars, getEnvVarsAsObj, getUserAgent, getConfigFilePath, replaceSecretPlaceholder };
