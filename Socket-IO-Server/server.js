'use strict';
var io = require('socket.io').listen(1234);

//Callmonitor
//Setup
require('./addressbook.js');
var CallMonitor = require('./callmonitor.js');
var fritzbox = {
  address: '192.168.178.1',
  port: '1012'
};
var monitor = new CallMonitor(fritzbox.address, fritzbox.port);

//Logic
monitor.on('inbound', function (call) {
    if (call.caller != "") {
        if (obj[call.caller]) { 
            io.sockets.emit('calling', obj[call.caller]);
        }
        if (!obj[call.caller]) { 
            io.sockets.emit('calling', call.caller);
        }
        };
});

monitor.on('disconnected', function (call) {
    io.sockets.emit('calling', 'clear');
});