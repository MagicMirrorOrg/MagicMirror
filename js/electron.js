/* jshint esversion: 6 */

"use strict";

const electron = require("electron");
const core = require(__dirname + "/app.js");

// Config
var config = process.env.config ? JSON.parse(process.env.config) : {};
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
	app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
	var electronOptionsDefaults = {
		width: 800,
		height: 600,
		x: 0,
		y: 0,
		darkTheme: true,
		webPreferences: {
			nodeIntegration: false,
			zoomFactor: config.zoom
		},
		backgroundColor: "#000000"
	};

	// DEPRECATED: "kioskmode" backwards compatibility, to be removed
	// settings these options directly instead provides cleaner interface
	if (config.kioskmode) {
		electronOptionsDefaults.kiosk = true;
	} else {
		electronOptionsDefaults.fullscreen = true;
		electronOptionsDefaults.autoHideMenuBar = true;
	}

	var electronOptions = Object.assign({}, electronOptionsDefaults, config.electronOptions);

	// Create the browser window.
	mainWindow = new BrowserWindow(electronOptions);

	// and load the index.html of the app.
	// If config.address is not defined or is an empty string (listening on all interfaces), connect to localhost
	var address = (config.address === void 0) | (config.address === "") ? (config.address = "localhost") : config.address;
	mainWindow.loadURL(`http://${address}:${config.port}`);

	// Open the DevTools if run with "npm start dev"
	if (process.argv.includes("dev")) {
		mainWindow.webContents.openDevTools();
	}

	// Set responders for window events.
	mainWindow.on("closed", function() {
		mainWindow = null;
	});

	if (config.kioskmode) {
		mainWindow.on("blur", function() {
			mainWindow.focus();
		});

		mainWindow.on("leave-full-screen", function() {
			mainWindow.setFullScreen(true);
		});

		mainWindow.on("resize", function() {
			setTimeout(function() {
				mainWindow.reload();
			}, 1000);
		});
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", function() {
	console.log("Launching application.");
	createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", function() {
	createWindow();
});

app.on("activate", function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

/* This method will be called when SIGINT is received and will call
 * each node_helper's stop function if it exists. Added to fix #1056
 *
 * Note: this is only used if running Electron. Otherwise
 * core.stop() is called by process.on("SIGINT"... in `app.js`
 */
app.on("before-quit", (event) => {
	console.log("Shutting down server...");
	event.preventDefault();
	setTimeout(() => { process.exit(0); }, 3000); // Force-quit after 3 seconds.
	core.stop();
	process.exit(0);
});

// Start the core application if server is run on localhost
// This starts all node helpers and starts the webserver.
if (["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1", undefined].indexOf(config.address) > -1) {
	core.start(function(c) {
		config = c;
	});
}
