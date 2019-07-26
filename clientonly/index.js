/* jshint esversion: 6 */

"use strict";

// Use separate scope to prevent global scope pollution
(function () {
	var config = {};

	// Helper function to get server address/hostname from either the commandline or env
	function getServerAddress() {
		// Helper function to get command line parameters
		// Assumes that a cmdline parameter is defined with `--key [value]`
		function getCommandLineParameter(key, defaultValue = undefined) {
			var index = process.argv.indexOf(`--${key}`);
			var value = index > -1 ? process.argv[index + 1] : undefined;
			return value !== undefined ? String(value) : defaultValue;
		}

		// Prefer command line arguments over environment variables
		["address", "port"].forEach((key) => {
			config[key] = getCommandLineParameter(key, process.env[key.toUpperCase()]);
		});
	}

	function getServerConfig(url) {
		// Return new pending promise
		return new Promise((resolve, reject) => {
			// Select http or https module, depending on reqested url
			const lib = url.startsWith("https") ? require("https") : require("http");
			const request = lib.get(url, (response) => {
				var configData = "";

				// Gather incoming data
				response.on("data", function(chunk) {
					configData += chunk;
				});
				// Resolve promise at the end of the HTTP/HTTPS stream
				response.on("end", function() {
					resolve(JSON.parse(configData));
				});
			});

			request.on("error", function(error) {
				reject(new Error(`Unable to read config from server (${url} (${error.message}`));
			});
		});
	}

	function fail(message, code = 1) {
		if (message !== undefined && typeof message === "string") {
			console.log(message);
		} else {
			console.log("Usage: 'node clientonly --address 192.168.1.10 --port 8080'");
		}
		process.exit(code);
	}

	getServerAddress();

	(config.address && config.port) || fail();

	// Only start the client if a non-local server was provided
	if (["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1", undefined].indexOf(config.address) === -1) {
		getServerConfig(`http://${config.address}:${config.port}/config/`)
			.then(function (configReturn) {
				// Pass along the server config via an environment variable
				var env = Object.create(process.env);
				var options = { env: env };
				configReturn.address = config.address;
				configReturn.port = config.port;
				env.config = JSON.stringify(configReturn);

				// Spawn electron application
				const electron = require("electron");
				const child = require("child_process").spawn(electron, ["js/electron.js"], options);

				// Pipe all child process output to current stdout
				child.stdout.on("data", function (buf) {
					process.stdout.write(`Client: ${buf}`);
				});

				// Pipe all child process errors to current stderr
				child.stderr.on("data", function (buf) {
					process.stderr.write(`Client: ${buf}`);
				});

				child.on("error", function (err) {
					process.stdout.write(`Client: ${err}`);
				});

				child.on("close", (code) => {
					if (code !== 0) {
						console.log(`There something wrong. The clientonly is not running code ${code}`);
					}
				});

			})
			.catch(function (reason) {
				fail(`Unable to connect to server: (${reason})`);
			});
	} else {
		fail();
	}
}());
