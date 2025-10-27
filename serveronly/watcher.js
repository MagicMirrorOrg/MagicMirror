// Load lightweight internal alias resolver to enable require("logger")
require("../js/alias-resolver");

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");
const http = require("http");
const Log = require("logger");
const { getConfigFilePath } = require("#server_functions");

const RESTART_DELAY_MS = 500;
const PORT_CHECK_MAX_ATTEMPTS = 20;
const PORT_CHECK_INTERVAL_MS = 500;

let child = null;
let restartTimer = null;
let isShuttingDown = false;
let isRestarting = false;
let serverConfig = null;
const rootDir = path.join(__dirname, "..");

/**
 * Get the server configuration (port and address)
 * @returns {{port: number, address: string}} The server config
 */
function getServerConfig () {
	if (serverConfig) return serverConfig;

	try {
		const configPath = getConfigFilePath();
		delete require.cache[require.resolve(configPath)];
		const config = require(configPath);
		serverConfig = {
			port: global.mmPort || config.port || 8080,
			address: config.address || "localhost"
		};
	} catch (err) {
		serverConfig = { port: 8080, address: "localhost" };
	}

	return serverConfig;
}

/**
 * Check if a port is available on the configured address
 * @param {number} port The port to check
 * @returns {Promise<boolean>} True if port is available
 */
function isPortAvailable (port) {
	return new Promise((resolve) => {
		const server = net.createServer();

		server.once("error", () => {
			resolve(false);
		});

		server.once("listening", () => {
			server.close();
			resolve(true);
		});

		// Use the same address as the actual server will bind to
		const { address } = getServerConfig();
		server.listen(port, address);
	});
}

/**
 * Wait until port is available
 * @param {number} port The port to wait for
 * @param {number} maxAttempts Maximum number of attempts
 * @returns {Promise<void>}
 */
async function waitForPort (port, maxAttempts = PORT_CHECK_MAX_ATTEMPTS) {
	for (let i = 0; i < maxAttempts; i++) {
		if (await isPortAvailable(port)) {
			Log.info(`Port ${port} is now available`);
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, PORT_CHECK_INTERVAL_MS));
	}
	Log.warn(`Port ${port} still not available after ${maxAttempts} attempts`);
}

/**
 * Start the server process
 */
function startServer () {
	// Start node directly instead of via npm to avoid process tree issues
	child = spawn("node", ["./serveronly"], {
		stdio: "inherit",
		cwd: path.join(__dirname, "..")
	});

	child.on("error", (error) => {
		Log.error("Failed to start server process:", error.message);
		child = null;
	});

	child.on("exit", (code, signal) => {
		child = null;

		if (isShuttingDown) {
			return;
		}

		if (isRestarting) {
			// Expected restart - don't log as error
			isRestarting = false;
		} else {
			// Unexpected exit
			Log.error(`Server exited unexpectedly with code ${code} and signal ${signal}`);
		}
	});
}

/**
 * Send reload notification to all connected clients
 */
function notifyClientsToReload () {
	const { port, address } = getServerConfig();
	const options = {
		hostname: address,
		port: port,
		path: "/reload",
		method: "GET"
	};

	const req = http.request(options, (res) => {
		if (res.statusCode === 200) {
			Log.info("Reload notification sent to clients");
		}
	});

	req.on("error", (err) => {
		// Server might not be running yet, ignore
		Log.debug(`Could not send reload notification: ${err.message}`);
	});

	req.end();
}

/**
 * Restart the server process
 * @param {string} reason The reason for the restart
 */
async function restartServer (reason) {
	if (restartTimer) clearTimeout(restartTimer);

	restartTimer = setTimeout(async () => {
		Log.info(reason);

		if (child) {
			isRestarting = true;

			// Get the actual port being used
			const { port } = getServerConfig();

			// Notify clients to reload before restart
			notifyClientsToReload();

			// Set up one-time listener for the exit event
			child.once("exit", async () => {
				// Wait until port is actually available
				await waitForPort(port);
				// Reset config cache in case it changed
				serverConfig = null;
				startServer();
			});

			child.kill("SIGTERM");
		} else {
			startServer();
		}
	}, RESTART_DELAY_MS);
}

/**
 * Watch a specific file for changes and restart the server on change
 * Watches the parent directory to handle editors that use atomic writes
 * @param {string} file The file path to watch
 */
function watchFile (file) {
	try {
		const fileName = path.basename(file);
		const dirName = path.dirname(file);

		const watcher = fs.watch(dirName, (_eventType, changedFile) => {
			// Only trigger for the specific file we're interested in
			if (changedFile !== fileName) return;

			Log.info(`[watchFile] Change detected in: ${file}`);
			if (restartTimer) clearTimeout(restartTimer);

			restartTimer = setTimeout(() => {
				Log.info(`[watchFile] Triggering restart due to change in: ${file}`);
				restartServer(`File changed: ${path.basename(file)} — restarting...`);
			}, RESTART_DELAY_MS);
		});

		watcher.on("error", (error) => {
			Log.error(`Watcher error for ${file}:`, error.message);
		});

		Log.log(`Watching file: ${file}`);
	} catch (error) {
		Log.error(`Failed to watch file ${file}:`, error.message);
	}
}

startServer();

// Setup file watching based on config
try {
	const configPath = getConfigFilePath();
	delete require.cache[require.resolve(configPath)];
	const config = require(configPath);

	let watchTargets = [];
	if (Array.isArray(config.watchTargets) && config.watchTargets.length > 0) {
		watchTargets = config.watchTargets.filter((target) => typeof target === "string" && target.trim() !== "");
	}

	if (watchTargets.length === 0) {
		Log.warn("Watch mode is enabled but no watchTargets are configured. No files will be monitored. Set the watchTargets array in your config.js to enable file watching.");
	}

	Log.log(`Watch mode enabled. Watching ${watchTargets.length} file(s)`);

	// Watch each target file
	for (const target of watchTargets) {
		const targetPath = path.isAbsolute(target)
			? target
			: path.join(rootDir, target);

		// Check if file exists
		if (!fs.existsSync(targetPath)) {
			Log.warn(`Watch target does not exist: ${targetPath}`);
			continue;
		}

		// Check if it's a file (directories are not supported)
		const stats = fs.statSync(targetPath);
		if (stats.isFile()) {
			watchFile(targetPath);
		} else {
			Log.warn(`Watch target is not a file (directories not supported): ${targetPath}`);
		}
	}
} catch (err) {
	// Config file might not exist or be invalid, use fallback targets
	Log.warn("Could not load watchTargets from config.");
}

process.on("SIGINT", () => {
	isShuttingDown = true;
	if (restartTimer) clearTimeout(restartTimer);
	if (child) child.kill("SIGTERM");
	process.exit(0);
});
