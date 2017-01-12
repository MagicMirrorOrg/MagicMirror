/* jshint esversion: 6 */

"use strict";

const Server = require(__dirname + "/server.js");
const electron = require("electron");
const core = require(__dirname + "/app.js");

// Config
var config = {};
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {

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
	}

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
	//mainWindow.loadURL('file://' + __dirname + '../../index.html');
	mainWindow.loadURL("http://localhost:" + config.port);

	// Open the DevTools if run with "npm start dev"
	if(process.argv[2] == "dev") {
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

// Start the core application.
// This starts all node helpers and starts the webserver.
core.start(function(c) {
	config = c;
});
