'use strict';

//for searching modules
const walk = require('walk');
const spawn = require('child_process').spawn;

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600,  fullscreen: true, "auto-hide-menu-bar": true, "node-integration": false});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '../../index.html');

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

//Walk module folder and get file names
var module_loader  = walk.walk(__dirname + '/../modules', { followLinks: false });

//for each file in modules
module_loader.on('file', function(root, stat, next) {
  //if file is called node_helper.js load it
  if (stat.name == "node_helper.js"){
    var module = (root + '/' + stat.name).split("/");
    var moduleName = module[module.length-2];

    //start module as child
    var child = spawn('node', [root + '/' + stat.name])

    // Make sure the output is logged.
    child.stdout.on('data', function(data) {
        process.stdout.write(moduleName + ': ' + data);
    });

    child.stderr.on('data', function(data) {
        process.stdout.write(moduleName + ': ' + data);
    });
    
    child.on('close', function(code) {
        console.log(moduleName + ' closing code: ' + code);
    });


    //Log module name  
    
    console.log("Started helper script for module " + moduleName + ".");
  }
  next();
});

module_loader.on('end', function() {
  console.log("All helpers started.");
});  

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

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
