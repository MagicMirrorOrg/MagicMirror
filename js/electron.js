'use strict';

//load modules
const walk = require('walk');
const fs = require('fs');
const Server = require(__dirname + '/server.js');
const spawn = require('child_process').spawn;
const electron = require('electron');


// Config
var config = {};
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

var nodeHelpers = [];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({width: 800, height: 600,  fullscreen: true, "auto-hide-menu-bar": true, "node-integration": false});

	// and load the index.html of the app.
	//mainWindow.loadURL('file://' + __dirname + '../../index.html');
	mainWindow.loadURL('http://localhost:' + config.port);

	// Open the DevTools.
	//mainWindow.webContents.openDevTools();

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}

function loadConfig (callback) {
	console.log("Loading config ...");
	var defaults = require(__dirname + '/defaults.js');
	var configFilename = __dirname + '/../config/config.js';

	try {
	    fs.accessSync(configFilename, fs.R_OK);
	    var c = require(configFilename);
		var config = Object.assign(defaults, c);
		callback(config);
	} catch (e) {
	    callback(defaults);
	}
}

function loadModule(moduleName) {
	var helperPath = __dirname + '/../modules/' + moduleName + '/node_helper.js';
	var loadModule = true;
	try {
	    fs.accessSync(helperPath, fs.R_OK);
	} catch (e) {
		loadModule = false;
		console.log("No helper found for module: " + moduleName + ".");
	}

	if (loadModule) {
		var Module = require(helperPath);
		var m = new Module();
	    m.setName(moduleName);
	    nodeHelpers.push(m);
	}
}

function loadModules(modules) {
	console.log("Loading module helpers ...");

	for (var m in modules) {
		loadModule(modules[m]);
	}

	console.log("All module helpers loaded.");
}

loadConfig(function(c) {
	config = c;

	var modules = [];

	for (var m in config.modules) {
		var module = config.modules[m];
		if (modules.indexOf(module.module) === -1) {
			modules.push(module.module);
		}
	}

	loadModules(modules);

	var server = new Server(config, function(io) {
		console.log('Server started ...');

		for (var h in nodeHelpers) {
			var nodeHelper = nodeHelpers[h];
			nodeHelper.setSocketIO(io);
			nodeHelper.start();
		}

		console.log('Sockets connected & modules started ...');

	});
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
	console.log('Launching application.');
	createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});
