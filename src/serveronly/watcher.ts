// Load lightweight internal alias resolver to enable require("logger")
import "../js/alias-resolver";

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";

import Log from "logger";

import { getConfigFilePath } from "#server_functions";

const RESTART_DELAY_MS = 500;
const PORT_CHECK_MAX_ATTEMPTS = 20;
const PORT_CHECK_INTERVAL_MS = 500;

let child: any = null;
let restartTimer: any = null;
let isShuttingDown = false;
let isRestarting = false;
let serverConfig: { port: number; address: string } | null = null;
const rootDir = path.join(__dirname, "..");

/**
 * Get the server configuration (port and address)
 * @returns {{port: number, address: string}} The server config
 */
function getServerConfig (): { port: number; address: string } {
	if (serverConfig) return serverConfig;

	try {
		const configPath = getConfigFilePath();
		delete require.cache[require.resolve(configPath)];
		const config = require(configPath);
		serverConfig = {
			port: (global as any).mmPort || config.port || 8080,
			address: config.address || "localhost"
		};
	} catch {
		serverConfig = { port: 8080, address: "localhost" };
	}

	return serverConfig;
}

/**
 * Check if a port is available on the configured address
 * @param {number} port The port to check
 * @returns {Promise<boolean>} True if port is available
 */
function isPortAvailable (port: number): Promise<boolean> {
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
async function waitForPort (port: number, maxAttempts: number = PORT_CHECK_MAX_ATTEMPTS): Promise<void> {
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
function startServer (): void {
	// Start node directly instead of via npm to avoid process tree issues
	child = spawn("node", ["./serveronly"], {
		stdio: "inherit",
		cwd: path.join(__dirname, "..")
	});

	child.on("error", (error: Error) => {
		Log.error("Failed to start server process:", error.message);
		child = null;
	});

	child.on("exit", (code: number | null, signal: string | null) => {
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
function notifyClientsToReload (): void {
	const { port, address } = getServerConfig();
	const options = {
		hostname: address,
		port: port,
		path: "/reload",
		method: "GET"
	};

	const req = http.request(options, (res: any) => {
		if (res.statusCode === 200) {
			Log.info("Reload notification sent to clients");
		}
	});

	req.on("error", (err: Error) => {
		// Server might not be running yet, ignore
		Log.debug(`Could not send reload notification: ${err.message}`);
	});

	req.end();
}

/**
 * Restart the server process
 * @param {string} reason The reason for the restart
 */
function restartServer (reason: string): void {
	if (restartTimer) clearTimeout(restartTimer);

	restartTimer = setTimeout(() => {
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
function watchFile (file: string): void {
	try {
		const fileName = path.basename(file);
		const dirName = path.dirname(file);

		const watcher = fs.watch(dirName, (_eventType: string, changedFile: string | null) => {
			// Only trigger for the specific file we're interested in
			if (changedFile !== fileName) return;

			Log.info(`[watchFile] Change detected in: ${file}`);
			if (restartTimer) clearTimeout(restartTimer);

			restartTimer = setTimeout(() => {
				Log.info(`[watchFile] Triggering restart due to change in: ${file}`);
				restartServer(`File changed: ${path.basename(file)} — restarting...`);
			}, RESTART_DELAY_MS);
		});

		watcher.on("error", (error: Error) => {
			Log.error(`Watcher error for ${file}:`, error.message);
		});

		Log.log(`Watching file: ${file}`);
	} catch (error) {
		Log.error(`Failed to watch file ${file}:`, (error as Error).message);
	}
}

startServer();

// Setup file watching based on config
try {
	const configPath = getConfigFilePath();
	delete require.cache[require.resolve(configPath)];
	const config = require(configPath);

	let watchTargets: string[] = [];
	if (Array.isArray(config.watchTargets) && config.watchTargets.length > 0) {
		watchTargets = config.watchTargets.filter((target: any) => typeof target === "string" && target.trim() !== "");
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
} catch {
	// Config file might not exist or be invalid, use fallback targets
	Log.warn("Could not load watchTargets from config.");
}

process.on("SIGINT", () => {
	isShuttingDown = true;
	if (restartTimer) clearTimeout(restartTimer);
	if (child) child.kill("SIGTERM");
	process.exit(0);
});

export {};
