"use strict";

const electron = require("electron");
const core = require("./app");
const Log = require("./logger");

// Config
let config = process.env.config ? JSON.parse(process.env.config) : {};
// Module to control application life.
const app = electron.app;

/*
 * Per default electron is started with --disable-gpu flag, if you want the gpu enabled,
 * you must set the env var ELECTRON_ENABLE_GPU=1 on startup.
 * See https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering for more info.
 */
if (process.env.ELECTRON_ENABLE_GPU !== "1") {
	app.disableHardwareAcceleration();
}

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

/*
 * Keep a global reference of the window object, if you don't, the window will
 * be closed automatically when the JavaScript object is garbage collected.
 */
let mainWindow;

/**
 *
 */
function createWindow () {

	/*
	 * see https://www.electronjs.org/docs/latest/api/screen
	 * Create a window that fills the screen's available work area.
	 */
	let electronSize = (800, 600);
	try {
		electronSize = electron.screen.getPrimaryDisplay().workAreaSize;
	} catch {
		Log.warn("Could not get display size, using defaults ...");
	}

	let electronSwitchesDefaults = ["autoplay-policy", "no-user-gesture-required"];
	app.commandLine.appendSwitch(...new Set(electronSwitchesDefaults, config.electronSwitches));
	let electronOptionsDefaults = {
		width: electronSize.width,
		height: electronSize.height,
		icon: "mm2.png",
		x: 0,
		y: 0,
		darkTheme: true,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			zoomFactor: config.zoom
		},
		backgroundColor: "#000000"
	};

	/*
	 * DEPRECATED: "kioskmode" backwards compatibility, to be removed
	 * settings these options directly instead provides cleaner interface
	 */
	if (config.kioskmode) {
		electronOptionsDefaults.kiosk = true;
	} else {
		electronOptionsDefaults.show = false;
		electronOptionsDefaults.frame = false;
		electronOptionsDefaults.transparent = true;
		electronOptionsDefaults.hasShadow = false;
		electronOptionsDefaults.fullscreen = true;
	}

	const electronOptions = Object.assign({}, electronOptionsDefaults, config.electronOptions);

	if (process.env.JEST_WORKER_ID !== undefined && process.env.MOCK_DATE !== undefined) {
		// if we are running with jest and we want to mock the current date
		const fakeNow = new Date(process.env.MOCK_DATE).valueOf();
		Date = class extends Date {
			constructor (...args) {
				if (args.length === 0) {
					super(fakeNow);
				} else {
					super(...args);
				}
			}
		};
		const __DateNowOffset = fakeNow - Date.now();
		const __DateNow = Date.now;
		Date.now = () => __DateNow() + __DateNowOffset;
	}

	// Create the browser window.
	mainWindow = new BrowserWindow(electronOptions);

	/*
	 * and load the index.html of the app.
	 * If config.address is not defined or is an empty string (listening on all interfaces), connect to localhost
	 */

	let prefix;
	if ((config.tls !== null && config.tls) || config.useHttps) {
		prefix = "https://";
	} else {
		prefix = "http://";
	}

	let address = (config.address === void 0) | (config.address === "") | (config.address === "0.0.0.0") ? (config.address = "localhost") : config.address;
	const port = process.env.MM_PORT || config.port;
	mainWindow.loadURL(`${prefix}${address}:${port}`);

	// Open the DevTools if run with "npm start dev"
	if (process.argv.includes("dev")) {
		if (process.env.JEST_WORKER_ID !== undefined) {
			// if we are running with jest
			const devtools = new BrowserWindow(electronOptions);
			mainWindow.webContents.setDevToolsWebContents(devtools.webContents);
		}
		mainWindow.webContents.openDevTools();
	}

	// simulate mouse move to hide black cursor on start
	mainWindow.webContents.on("dom-ready", (event) => {
		mainWindow.webContents.sendInputEvent({ type: "mouseMove", x: 0, y: 0 });
	});

	// Set responders for window events.
	mainWindow.on("closed", function () {
		mainWindow = null;
	});

	if (config.kioskmode) {
		mainWindow.on("blur", function () {
			mainWindow.focus();
		});

		mainWindow.on("leave-full-screen", function () {
			mainWindow.setFullScreen(true);
		});

		mainWindow.on("resize", function () {
			setTimeout(function () {
				mainWindow.reload();
			}, 1000);
		});
	}

	//remove response headers that prevent sites of being embedded into iframes if configured
	mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
		let curHeaders = details.responseHeaders;
		if (config.ignoreXOriginHeader || false) {
			curHeaders = Object.fromEntries(Object.entries(curHeaders).filter((header) => !(/x-frame-options/i).test(header[0])));
		}

		if (config.ignoreContentSecurityPolicy || false) {
			curHeaders = Object.fromEntries(Object.entries(curHeaders).filter((header) => !(/content-security-policy/i).test(header[0])));
		}

		callback({ responseHeaders: curHeaders });
	});

	mainWindow.once("ready-to-show", () => {
		mainWindow.show();
	});
}

// Quit when all windows are closed.
app.on("window-all-closed", function () {
	if (process.env.JEST_WORKER_ID !== undefined) {
		// if we are running with jest
		app.quit();
	} else {
		createWindow();
	}
});

app.on("activate", function () {

	/*
	 * On OS X it's common to re-create a window in the app when the
	 * dock icon is clicked and there are no other windows open.
	 */
	if (mainWindow === null) {
		createWindow();
	}
});

/*
 * This method will be called when SIGINT is received and will call
 * each node_helper's stop function if it exists. Added to fix #1056
 *
 * Note: this is only used if running Electron. Otherwise
 * core.stop() is called by process.on("SIGINT"... in `app.js`
 */
app.on("before-quit", async (event) => {
	Log.log("Shutting down server...");
	event.preventDefault();
	setTimeout(() => {
		process.exit(0);
	}, 3000); // Force-quit after 3 seconds.
	await core.stop();
	process.exit(0);
});

/**
 * Handle errors from self-signed certificates
 */
app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
	event.preventDefault();
	callback(true);
});

if (process.env.clientonly) {
	app.whenReady().then(() => {
		Log.log("Launching client viewer application.");
		createWindow();
	});
}

/*
 * Start the core application if server is run on localhost
 * This starts all node helpers and starts the webserver.
 */
if (["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1", undefined].includes(config.address)) {
	core.start().then((c) => {
		config = c;
		app.whenReady().then(() => {
			Log.log("Launching application.");
			createWindow();
		});
	});
}
