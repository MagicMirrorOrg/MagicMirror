const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");
const express = require("express");
const ipfilter = require("express-ipfilter").IpFilter;
const helmet = require("helmet");
const socketio = require("socket.io");
const Log = require("logger");
const { cors, getConfig, getHtml, getVersion, getStartup, getEnvVars, readConfig, getServerInfo, getTrafficConfig } = require("#server_functions");

const vendor = require(`${__dirname}/vendor`);

/**
 * Server
 * @param {object} config The MM config
 * @class
 */
function Server (config) {
	const app = express();
	const port = process.env.MM_PORT || config.port;
	const serverSockets = new Set();
	let server = null;
	let io = null;
	let currentModuleConfigs = {};

	/**
	 * Opens the server for incoming connections
	 * @returns {Promise} A promise that is resolved when the server listens to connections
	 */
	this.open = function () {
		return new Promise((resolve) => {
			if (config.useHttps) {
				const options = {
					key: fs.readFileSync(config.httpsPrivateKey),
					cert: fs.readFileSync(config.httpsCertificate)
				};
				server = https.Server(options, app);
			} else {
				server = http.Server(app);
			}
			io = socketio(server, {
				cors: {
					origin: /.*$/,
					credentials: true
				},
				allowEIO3: true,
				pingInterval: 120000, // server → client ping every 2 mins
				pingTimeout: 120000 // wait up to 2 mins for client pong
			});

			server.on("connection", (socket) => {
				serverSockets.add(socket);
				socket.on("close", () => {
					serverSockets.delete(socket);
				});
			});

			Log.log(`Starting server on port ${port} ... `);

			// Add explicit error handling BEFORE calling listen so we can give user-friendly feedback
			server.once("error", (err) => {
				if (err && err.code === "EADDRINUSE") {
					const bindAddr = config.address || "localhost";
					const portInUseMessage = [
						"",
						"────────────────────────────────────────────────────────────────",
						` PORT IN USE: ${bindAddr}:${port}`,
						"",
						" Another process (most likely another MagicMirror instance)",
						" is already using this port.",
						"",
						" Stop the other process (free the port) or use a different port.",
						"────────────────────────────────────────────────────────────────"
					].join("\n");
					Log.error(portInUseMessage);
					return;
				}

				Log.error("Failed to start server:", err);
			});

			server.listen(port, config.address || "localhost");

			// Admin routes - placed before ipWhitelist to allow unrestricted access
			app.use(express.json());
			app.get("/admin", (req, res) => {
				const adminHtml = fs.readFileSync(path.resolve(`${global.root_path}/admin.html`), { encoding: "utf8" });
				res.send(adminHtml);
			});

			app.get("/admin/api/server-info", (req, res) => {
				try {
					const serverInfo = getServerInfo(config);
					res.json({ success: true, serverInfo });
				} catch (error) {
					Log.error("[Admin] Error getting server info:", error);
					res.json({ success: false, error: "Unable to determine server address" });
				}
			});

			app.get("/admin/api/config/traffic", (req, res) => {
				try {
					const storedConfig = readConfig();
					const currentTrafficConfig = currentModuleConfigs.traffic;
					const storedTrafficConfig = getTrafficConfig(storedConfig);
					if (storedTrafficConfig === null && currentTrafficConfig === null) {
						res.json({ success: false, error: "Traffic module not found in config" });
					} else {
						res.json({ success: true, config: currentTrafficConfig || storedTrafficConfig });
					}
				} catch (error) {
					Log.error("[Admin] Error getting traffic config:", error);
					res.json({ success: false, error: error.message || "Failed to get traffic configuration" });
				}
			});

			app.post("/admin/api/config/traffic", (req, res) => {
				try {
					// Broadcast socket notification to update modules
					if (io) {
						io.of("traffic").emit("MODULE_CONFIG_UPDATED", req.body);
						if (req.body.enabled !== undefined) {
							currentModuleConfigs.traffic = req.body;
							io.of("traffic").emit(req.body.enabled ? "MODULE_ENABLED" : "MODULE_DISABLED", {});
						}
					}
					res.json({ success: true, message: "Traffic module configuration updated successfully" });
				} catch (error) {
					Log.error("[Admin] Error updating traffic config:", error);
					res.json({ success: false, error: error.message || "Failed to update traffic configuration" });
				}
			});

			if (config.ipWhitelist instanceof Array && config.ipWhitelist.length === 0) {
				Log.warn("You're using a full whitelist configuration to allow for all IPs");
			}

			app.use(function (req, res, next) {
				ipfilter(config.ipWhitelist, { mode: config.ipWhitelist.length === 0 ? "deny" : "allow", log: false })(req, res, function (err) {
					if (err === undefined) {
						res.header("Access-Control-Allow-Origin", "*");
						return next();
					}
					Log.log(err.message);
					res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
				});
			});

			app.use(helmet(config.httpHeaders));
			app.use("/js", express.static(__dirname));

			let directories = ["/config", "/css", "/modules", "/node_modules/animate.css", "/node_modules/@fontsource", "/node_modules/@fortawesome", "/translations", "/tests/configs", "/tests/mocks"];
			for (const [key, value] of Object.entries(vendor)) {
				const dirArr = value.split("/");
				if (dirArr[0] === "node_modules") directories.push(`/${dirArr[0]}/${dirArr[1]}`);
			}
			const uniqDirs = [...new Set(directories)];
			for (const directory of uniqDirs) {
				app.use(directory, express.static(path.resolve(global.root_path + directory)));
			}

			app.get("/cors", async (req, res) => await cors(req, res));

			app.get("/version", (req, res) => getVersion(req, res));

			app.get("/config", (req, res) => getConfig(req, res));

			app.get("/startup", (req, res) => getStartup(req, res));

			app.get("/env", (req, res) => getEnvVars(req, res));

			app.get("/", (req, res) => getHtml(req, res));

			server.on("listening", () => {
				resolve({
					app,
					io
				});
			});
		});
	};

	/**
	 * Closes the server and destroys all lingering connections to it.
	 * @returns {Promise} A promise that resolves when server has successfully shut down
	 */
	this.close = function () {
		return new Promise((resolve) => {
			for (const socket of serverSockets.values()) {
				socket.destroy();
			}
			server.close(resolve);
		});
	};
}

module.exports = Server;
