const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const Log = require("../js/logger");

let child = null;
let restartTimer = null;

/**
 * Start the server process
 */
function startServer () {
	child = spawn("npm", ["run", "server"], { stdio: "inherit" });

	child.on("exit", (code) => {
		Log.info(`Changes detected : ${code}`);
		Log.info("Restarting server...");
		startServer();
	});
}

/**
 * Watch a directory for changes and restart the server on change
 * @param dir
 */
function watchDir (dir) {
	fs.watch(dir, { recursive: true }, (_eventType, filename) => {
		if (!filename) return;

		if (dir.includes("modules") && !filename.endsWith("node_helper.js")) return;

		if (restartTimer) clearTimeout(restartTimer);

		restartTimer = setTimeout(() => {
			Log.info(`Changes detected in ${dir}: ${filename} — restarting...`);
			if (child) child.kill("SIGTERM");
		}, 500);
	});
}

startServer();
watchDir(path.join(__dirname, "..", "config"));
watchDir(path.join(__dirname, "..", "modules"));

process.on("SIGINT", () => {
	if (restartTimer) clearTimeout(restartTimer);
	if (child) child.kill("SIGTERM");
	process.exit(0);
});
