import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import ipaddr from "ipaddr.js";
import undici from "undici";
import Log from "./logger.js";

const startUp = new Date();

/**
 * Gets the startup time.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
const getStartup = (req, res) => {
	res.send(startUp);
};

/**
 * Replace `**SECRET_ABC**` placeholders with the value of `process.env.SECRET_ABC`.
 *
 * If `allowedSecrets` is given, only those secret names are restored and every
 * other placeholder is left untouched.
 * @param {string} input - String that may contain `**SECRET_***` placeholders.
 * @param {Set<string>} [allowedSecrets] - Secret names that may be restored.
 * @returns {string} The input with the allowed placeholders replaced.
 */
const replaceSecretPlaceholder = (input, allowedSecrets) => {
	if (global.config.cors === "allowAll") {
		if (input.includes("**SECRET_")) {
			Log.error("Replacing secrets doesn't work with CORS `allowAll`, you need to set `cors` to `disabled` or `allowWhitelist` in `config.js`");
		}
		return input;
	}
	return input.replaceAll(/\*\*(SECRET_[^*]+)\*\*/g, (placeholder, secretName) => {
		// Block replacing secrets that are not explicitly allowed.
		if (allowedSecrets && !allowedSecrets.has(secretName)) {
			return placeholder;
		}

		// Load the real value from the environment. Fallback to placeholder if missing.
		return process.env[secretName] || placeholder;
	});
};

/**
 * Validates that a hostname is allowed by the CORS configuration and resolves to a public unicast IP.
 * @param {string} hostname - The hostname to validate.
 * @returns {Promise<string>} The validated IP address.
 */
const validateCorsHost = async (hostname) => {
	const host = hostname.toLowerCase();

	if (host === "localhost") {
		Log.warn(`SSRF blocked (localhost): ${hostname}`);
		const error = new Error("Forbidden: private or reserved addresses are not allowed");
		error.statusCode = 403;
		throw error;
	}

	if (global.config.cors === "allowWhitelist" && !global.config.corsDomainWhitelist.includes(host)) {
		Log.warn(`CORS blocked (not in whitelist): ${hostname}`);
		const error = new Error("Forbidden: domain not in corsDomainWhitelist");
		error.statusCode = 403;
		throw error;
	}

	const { address } = await dns.promises.lookup(host);
	if (ipaddr.process(address).range() !== "unicast") {
		Log.warn(`SSRF blocked: ${hostname}`);
		const error = new Error("Forbidden: private or reserved addresses are not allowed");
		error.statusCode = 403;
		throw error;
	}

	return address;
};

/**
 * Validates a CORS URL and expands only secrets approved for its hostname.
 * @param {string} url - The requested URL.
 * @returns {{url: string, containsSecrets: boolean}} The resolved request URL and redirect policy.
 */
const resolveCorsUrl = (url) => {
	const reject = (message) => {
		const error = new Error(message);
		error.statusCode = 403;
		throw error;
	};

	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		Log.warn(`SSRF blocked (invalid URL): ${url}`);
		reject("Forbidden: private or reserved addresses are not allowed");
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		Log.warn(`SSRF blocked (protocol): ${url}`);
		reject("Forbidden: private or reserved addresses are not allowed");
	}

	const hostname = parsed.hostname.toLowerCase();
	const configuredSecrets = global.config.cors === "allowWhitelist" && global.config.corsDomainWhitelist.includes(hostname)
		? global.config.corsSecretWhitelist?.[hostname]
		: [];
	const allowedSecrets = new Set(Array.isArray(configuredSecrets) ? configuredSecrets : []);
	const expandedUrl = replaceSecretPlaceholder(url, allowedSecrets);
	const containsSecrets = expandedUrl !== url;

	if (containsSecrets) {
		let expanded;
		try {
			expanded = new URL(expandedUrl);
		} catch {
			reject("Forbidden: invalid secret URL");
		}
		if (expanded.protocol !== "https:" || expanded.port || expanded.origin !== parsed.origin || expanded.username || expanded.password) {
			reject("Forbidden: secrets require HTTPS on port 443 with an unchanged origin and no credentials");
		}
	}

	return { url: expandedUrl, containsSecrets };
};

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
const cors = async (req, res) => {
	if (global.config.cors === "disabled") {
		Log.error("CORS is disabled, you need to enable it in `config.js` by setting `cors` to `allowAll` or `allowWhitelist`");
		return res.status(403).json({ error: "CORS proxy is disabled" });
	}
	let url;
	let containsSecrets = false;
	try {
		const urlRegEx = "url=(.+?)$";

		const match = new RegExp(urlRegEx, "g").exec(req.url);
		if (!match) {
			url = `invalid url: ${req.url}`;
			Log.error(url);
			return res.status(400).send(url);
		} else {
			({ url, containsSecrets } = resolveCorsUrl(match[1]));

			const headersToSend = getHeadersToSend(req.url);
			const expectedReceivedHeaders = geExpectedReceivedHeaders(req.url);
			Log.log(`cors host: ${new URL(url).host}`);

			// Validate each host immediately before connecting and pin the socket to its public IP.
			const defaultConnector = undici.buildConnector({});
			const dispatcher = new undici.Agent({
				connect: async (options, callback) => {
					try {
						const address = await validateCorsHost(options.hostname);
						// Keep the original hostname for TLS SNI while connecting to the validated IP.
						defaultConnector({ ...options, hostname: address, servername: options.servername || options.hostname }, callback);
					} catch (err) {
						callback(err, null);
					}
				}
			});

			try {
				const response = await undici.fetch(url, { dispatcher, headers: headersToSend, redirect: containsSecrets ? "error" : "follow" });
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
			} finally {
				await dispatcher.close();
			}
		}
	} catch (error) {
		const cause = error.cause?.statusCode ? error.cause : error;
		const message = containsSecrets ? "CORS request with secrets failed" : cause.message;
		if (process.env.mmTestMode !== "true") {
			Log.error(`Error in CORS request: ${containsSecrets ? message : cause}`);
		}
		res.status(cause.statusCode || 500).json({ error: message });
	}
};

/**
 * Gets headers and values to attach to the web request.
 * @param {string} url - The url containing the headers and values to send.
 * @returns {object} An object specifying name and value of the headers.
 */
const getHeadersToSend = (url) => {
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
};

/**
 * Gets the headers expected from the response.
 * @param {string} url - The url containing the expected headers from the response.
 * @returns {string[]} headers - The name of the expected headers.
 */
const geExpectedReceivedHeaders = (url) => {
	const expectedReceivedHeaders = ["Content-Type"];
	const expectedReceivedHeadersMatch = new RegExp("expectedheaders=(.+?)(&|$)", "g").exec(url);
	if (expectedReceivedHeadersMatch) {
		const headers = expectedReceivedHeadersMatch[1].split(",");
		for (const header of headers) {
			expectedReceivedHeaders.push(header);
		}
	}
	return expectedReceivedHeaders;
};

/**
 * Gets the HTML to display the magic mirror.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
const getHtml = (req, res) => {
	let html = fs.readFileSync(path.resolve(`${global.root_path}/index.html`), { encoding: "utf8" });
	html = html.replace("#VERSION#", global.version);
	html = html.replace("#TESTMODE#", global.mmTestMode);

	res.send(html);
};

/**
 * Gets the MagicMirror version.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
const getVersion = (req, res) => {
	res.send(global.version);
};

/**
 * Gets the preferred `User-Agent`
 * @returns {string} `User-Agent` to be used
 */
const getUserAgent = () => {
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
};

/**
 * Gets environment variables needed in the browser.
 * @returns {object} environment variables key: values
 */
const getEnvVarsAsObj = () => {
	const obj = { modulesDir: `${global.config.foreignModulesDir}`, defaultModulesDir: `${global.config.defaultModulesDir}`, customCss: `${global.config.customCss}` };
	if (process.env.MM_MODULES_DIR) {
		obj.modulesDir = process.env.MM_MODULES_DIR.replace(`${global.root_path}/`, "");
	}
	if (process.env.MM_CUSTOMCSS_FILE) {
		obj.customCss = process.env.MM_CUSTOMCSS_FILE.replace(`${global.root_path}/`, "");
	}

	return obj;
};

/**
 * Gets environment variables needed in the browser.
 * @param {Request} req - the request
 * @param {Response} res - the result
 */
const getEnvVars = (req, res) => {
	const obj = getEnvVarsAsObj();
	res.send(obj);
};

/**
 * Resolves the HTTP server port. The `MM_PORT` environment variable takes
 * precedence over the configured port, falling back to 8080.
 * @param {object} [config] the configuration to read the port from (defaults to global.config)
 * @returns {number} the port the server should listen on
 */
const getServerPort = (config = global.config) => {
	return Number(process.env.MM_PORT || config?.port || 8080);
};

/**
 * Get the config file path from environment or default location
 * @returns {string} The absolute config file path
 */
const getConfigFilePath = () => {
	// Ensure root_path is set (for standalone contexts like watcher)
	if (!global.root_path) {
		global.root_path = path.resolve(import.meta.dirname, "../");
	}

	// Check environment variable if global not set
	if (!global.configuration_file && process.env.MM_CONFIG_FILE) {
		global.configuration_file = process.env.MM_CONFIG_FILE;
	}

	return path.resolve(global.configuration_file || `${global.root_path}/config/config.js`);
};

const serverFunctions = { cors, getHtml, getVersion, getStartup, getEnvVars, getEnvVarsAsObj, getUserAgent, getServerPort, getConfigFilePath, replaceSecretPlaceholder };

export {
	serverFunctions as "module.exports",
	cors,
	getHtml,
	getVersion,
	getStartup,
	getEnvVars,
	getEnvVarsAsObj,
	getUserAgent,
	getServerPort,
	getConfigFilePath,
	replaceSecretPlaceholder
};
