"use strict";

const http = require("node:http");
const https = require("node:https");

/**
 * Get command line parameters
 * Assumes that a cmdline parameter is defined with `--key [value]`
 *
 * example: `node clientonly --address localhost --port 8080 --use-tls`
 * @param {string} key key to look for at the command line
 * @param {string} defaultValue value if no key is given at the command line
 * @returns {string} the value of the parameter
 */
function getCommandLineParameter (key, defaultValue = undefined) {
	const index = process.argv.indexOf(`--${key}`);
	const value = index > -1 ? process.argv[index + 1] : undefined;
	return value !== undefined ? String(value) : defaultValue;
}

/**
 * Helper function to get server address/hostname from either the commandline or env
 * @returns {object} config object containing address, port, and tls properties
 */
function getServerParameters () {
	const config = {};

	// Prefer command line arguments over environment variables
	config.address = getCommandLineParameter("address", process.env.ADDRESS);
	const portValue = getCommandLineParameter("port", process.env.PORT);
	config.port = portValue ? parseInt(portValue, 10) : undefined;

	// determine if "--use-tls"-flag was provided
	config.tls = process.argv.includes("--use-tls");

	return config;
}

/**
 * Gets the config from the specified server url
 * @param {string} url location where the server is running.
 * @returns {Promise} the config
 */
function getServerConfig (url) {
	// Return new pending promise
	return new Promise((resolve, reject) => {
		// Select http or https module, depending on requested url
		const lib = url.startsWith("https") ? https : http;
		const request = lib.get(url, (response) => {
			let configData = "";

			// Gather incoming data
			response.on("data", function (chunk) {
				configData += chunk;
			});
			// Resolve promise at the end of the HTTP/HTTPS stream
			response.on("end", function () {
				try {
					resolve(JSON.parse(configData));
				} catch (parseError) {
					reject(new Error(`Failed to parse server response as JSON: ${parseError.message}`));
				}
			});
		});

		request.on("error", function (error) {
			reject(new Error(`Unable to read config from server (${url}) (${error.message})`));
		});
	});
}

/**
 * Print a message to the console in case of errors
 * @param {string} message error message to print
 * @param {number} code error code for the exit call
 */
function fail (message, code = 1) {
	if (message !== undefined && typeof message === "string") {
		console.error(message);
	} else {
		console.error("Usage: 'node clientonly --address 192.168.1.10 --port 8080 [--use-tls]'");
	}
	process.exit(code);
}

/**
 * Starts the client by connecting to the server and launching the Electron application
 * @param {object} config server configuration
 * @param {string} prefix http or https prefix
 * @async
 */
async function startClient (config, prefix) {
	try {
		const serverUrl = `${prefix}${config.address}:${config.port}/config/`;
		console.log(`Client: Connecting to server at ${serverUrl}`);
		const configReturn = await getServerConfig(serverUrl);
		console.log("Client: Successfully retrieved config from server");

		// check environment for DISPLAY or WAYLAND_DISPLAY
		const elecParams = ["js/electron.js"];
		if (process.env.WAYLAND_DISPLAY) {
			console.log(`Client: Using WAYLAND_DISPLAY=${process.env.WAYLAND_DISPLAY}`);
			elecParams.push("--enable-features=UseOzonePlatform");
			elecParams.push("--ozone-platform=wayland");
		} else if (process.env.DISPLAY) {
			console.log(`Client: Using DISPLAY=${process.env.DISPLAY}`);
		} else {
			fail("Error: Requires environment variable WAYLAND_DISPLAY or DISPLAY, none is provided.");
		}

		// Pass along the server config via an environment variable
		const env = { ...process.env };
		env.clientonly = true;
		const options = { env: env };
		configReturn.address = config.address;
		configReturn.port = config.port;
		configReturn.tls = config.tls;
		env.config = JSON.stringify(configReturn);

		// Spawn electron application
		const electron = require("electron");
		const child = require("node:child_process").spawn(electron, elecParams, options);

		// Pipe all child process output to current stdout
		child.stdout.on("data", function (buf) {
			process.stdout.write(`Client: ${buf}`);
		});

		// Pipe all child process errors to current stderr
		child.stderr.on("data", function (buf) {
			process.stderr.write(`Client: ${buf}`);
		});

		child.on("error", function (err) {
			process.stderr.write(`Client: ${err}`);
		});

		child.on("close", (code) => {
			if (code !== 0) {
				fail(`There is something wrong. The clientonly process exited with code ${code}.`);
			}
		});
	} catch (reason) {
		fail(`Unable to connect to server: (${reason})`);
	}
}

// Main execution
const config = getServerParameters();
const prefix = config.tls ? "https://" : "http://";

// Validate port
if (config.port !== undefined && (isNaN(config.port) || config.port < 1 || config.port > 65535)) {
	fail(`Invalid port number: ${config.port}. Port must be between 1 and 65535.`);
}

// Only start the client if a non-local server was provided and address/port are set
const LOCAL_ADDRESSES = ["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1"];
if (
	config.address
	&& config.port
	&& !LOCAL_ADDRESSES.includes(config.address)
) {
	startClient(config, prefix);
} else {
	fail();
}
