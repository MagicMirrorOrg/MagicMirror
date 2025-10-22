const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");
const Log = require("../js/logger");

const RESTART_DELAY_MS = 500;
const PORT_CHECK_MAX_ATTEMPTS = 20;
const PORT_CHECK_INTERVAL_MS = 500;

let child = null;
let restartTimer = null;
let isShuttingDown = false;
let isRestarting = false;
let watcherErrorLogged = false;
let serverPort = null;

/**
 * Get the server port from config
 * @returns {number} The port number
 */
function getServerPort () {
	if (serverPort) return serverPort;

	try {
		// Try to read the config file to get the port
		const configPath = path.join(__dirname, "..", "config", "config.js");
		delete require.cache[require.resolve(configPath)];
		const config = require(configPath);
		serverPort = global.mmPort || config.port || 8080;
	} catch (err) {
		serverPort = 8080;
	}

	return serverPort;
}

/**
 * Check if a port is available
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

		server.listen(port, "127.0.0.1");
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
			const port = getServerPort();

			// Set up one-time listener for the exit event
			child.once("exit", async () => {
				// Wait until port is actually available
				await waitForPort(port);
				// Reset port cache in case config changed
				serverPort = null;
				startServer();
			});

			child.kill("SIGTERM");
		} else {
			startServer();
		}
	}, RESTART_DELAY_MS);
}

/**
 * Watch a directory for changes and restart the server on change
 * @param {string} dir The directory path to watch
 */
function watchDir (dir) {
	try {
		const watcher = fs.watch(dir, { recursive: true }, (_eventType, filename) => {
			if (!filename) return;

			// Ignore node_modules - too many changes during npm install
			// After installing dependencies, manually restart the watcher
			if (filename.includes("node_modules")) return;

			// Only watch .js, .mjs and .cjs files
			if (!filename.endsWith(".js") && !filename.endsWith(".mjs") && !filename.endsWith(".cjs")) return;

			if (restartTimer) clearTimeout(restartTimer);

			restartTimer = setTimeout(() => {
				restartServer(`Changes detected in ${dir}: ${filename} — restarting...`);
			}, RESTART_DELAY_MS);
		});

		watcher.on("error", (error) => {
			if (error.code === "ENOSPC") {
				if (!watcherErrorLogged) {
					watcherErrorLogged = true;
					Log.error("System limit for file watchers reached. Try increasing: sudo sysctl fs.inotify.max_user_watches=524288");
				}
			} else {
				Log.error(`Watcher error for ${dir}:`, error.message);
			}
		});
	} catch (error) {
		Log.error(`Failed to watch directory ${dir}:`, error.message);
	}
}

/**
 * Watch a specific file for changes and restart the server on change
 * @param {string} file The file path to watch
 */
function watchFile (file) {
	try {
		const watcher = fs.watch(file, (_eventType) => {
			if (restartTimer) clearTimeout(restartTimer);

			restartTimer = setTimeout(() => {
				restartServer(`Config file changed: ${path.basename(file)} — restarting...`);
			}, RESTART_DELAY_MS);
		});

		watcher.on("error", (error) => {
			Log.error(`Watcher error for ${file}:`, error.message);
		});

		Log.log(`Watching config file: ${file}`);
	} catch (error) {
		Log.error(`Failed to watch file ${file}:`, error.message);
	}
}

/**
 * Get the config file path from environment or default location
 * @returns {string} The config file path
 */
function getConfigFilePath () {
	if (process.env.MM_CONFIG_FILE) {
		return process.env.MM_CONFIG_FILE;
	}

	if (global.configuration_file && global.root_path) {
		return path.resolve(global.root_path, global.configuration_file);
	}

	return path.join(__dirname, "..", "config", "config.js");
}

startServer();

// Watch the config file (might be in custom location)
// Priority: MM_CONFIG_FILE env var, then global.configuration_file, then default
const configFile = getConfigFilePath();
watchFile(configFile);

// Watch core directories (modules, js and serveronly)
// We watch specific directories instead of the whole project root to avoid
// watching unnecessary files like node_modules (even though we filter it),
// tests, translations, css, fonts, vendor, etc.
watchDir(path.join(__dirname, "..", "modules"));
watchDir(path.join(__dirname, "..", "js"));
watchDir(path.join(__dirname)); // serveronly

process.on("SIGINT", () => {
	isShuttingDown = true;
	if (restartTimer) clearTimeout(restartTimer);
	if (child) child.kill("SIGTERM");
	process.exit(0);
});
