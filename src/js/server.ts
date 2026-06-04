import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import express from "express";
import helmet from "helmet";
import socketio from "socket.io";
import Log from "logger";
import { ipAccessControl } from "./ip_access_control";
import { getHtml, getVersion, getEnvVars, cors } from "#server_functions";

const vendor = require("./vendor");

/**
 * Server
 * @param {object} configObj The MM config full and redacted
 * @class
 */
function Server (this: any, configObj: any) {
	const config = configObj.fullConf;
	const app = express();
	const port = process.env.MM_PORT || config.port;
	const serverSockets = new Set<any>();
	let server: any = null;

	/**
	 * Opens the server for incoming connections
	 * @returns {Promise} A promise that is resolved when the server listens to connections
	 */
	this.open = function (): Promise<any> {
		return new Promise((resolve) => {
			if (config.useHttps) {
				const options = {
					key: fs.readFileSync(config.httpsPrivateKey),
					cert: fs.readFileSync(config.httpsCertificate)
				};
				server = (https.Server as any)(options, app);
			} else {
				server = (http.Server as any)(app);
			}
			const io = (socketio as any)(server, {
				cors: {
					origin: /.*$/,
					credentials: true
				},
				allowEIO3: true,
				pingInterval: 120000, // server → client ping every 2 mins
				pingTimeout: 120000 // wait up to 2 mins for client pong
			});

			server.on("connection", (socket: any) => {
				serverSockets.add(socket);
				socket.on("close", () => {
					serverSockets.delete(socket);
				});
			});

			Log.log(`Starting server on port ${port} ... `);

			// Add explicit error handling BEFORE calling listen so we can give user-friendly feedback
			server.once("error", (err: any) => {
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

			if (config.ipWhitelist instanceof Array && config.ipWhitelist.length === 0) {
				Log.warn("You're using a full whitelist configuration to allow for all IPs");
			}

			app.use(ipAccessControl(config.ipWhitelist));
			app.use(helmet(config.httpHeaders));
			app.use("/js", express.static(__dirname));

			if (config.hideConfigSecrets) {
				app.get("/config/config.env", (req: any, res: any) => {
					res.status(404).send("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /config/config.env</pre>\n</body>\n</html>");
				});
			}

			const directories: string[] = ["/config", "/css", "/favicon.svg", "/defaultmodules", "/modules", "/node_modules/animate.css", "/node_modules/@fontsource", "/node_modules/@fortawesome", "/translations", "/tests/configs", "/tests/mocks"];
			for (const value of Object.values(vendor) as string[]) {
				const dirArr = value.split("/");
				if (dirArr[0] === "node_modules") directories.push(`/${dirArr[0]}/${dirArr[1]}`);
			}
			const uniqDirs = [...new Set(directories)];
			for (const directory of uniqDirs) {
				app.use(directory, express.static(path.resolve(global.root_path + directory)));
			}

			const startUp = new Date();
			const getStartup = (req: any, res: any) => res.send(startUp);

			const getConfig = (req: any, res: any) => {
				const obj = config.hideConfigSecrets ? configObj.redactedConf : configObj.fullConf;
				// Functions can't survive JSON.stringify, so we wrap them in a
				// tagged object { __mmFunction: "<source>" }. The client-side
				// JSON reviver in main.js recognises this tag and reconstructs
				// the live function from the source string.
				const jsonString = JSON.stringify(obj, (key, value) => {
					if (typeof value === "function") {
						return { __mmFunction: value.toString() };
					}
					return value;
				});
				res.set("Content-Type", "application/json");
				res.send(jsonString);
			};

			app.get("/config", (req: any, res: any) => getConfig(req, res));

			app.get("/cors", async (req: any, res: any) => await cors(req, res));

			app.get("/version", (req: any, res: any) => getVersion(req, res));

			app.get("/startup", (req: any, res: any) => getStartup(req, res));

			app.get("/env", (req: any, res: any) => getEnvVars(req, res));

			app.get("/", (req: any, res: any) => getHtml(req, res));

			// Reload endpoint for watch mode - triggers browser reload
			app.get("/reload", (req: any, res: any) => {
				Log.info("Reload request received, notifying all clients");
				io.emit("RELOAD");
				res.status(200).send("OK");
			});

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
	this.close = function (): Promise<any> {
		return new Promise((resolve) => {
			for (const socket of serverSockets.values()) {
				socket.destroy();
			}
			server.close(resolve);
		});
	};
}

export = Server;
