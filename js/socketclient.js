if (typeof window === 'undefined') {
	// Only perfom this part if is isn't running in the browser.

	// Load socket client
	var io = require('socket.io-client');

	// Load config
	var fs = require('fs');

	var config = {};

	var defaults = require(__dirname + '/defaults.js');
	var configFilename = __dirname + '/../config/config.js';

	try {
	    fs.accessSync(configFilename, fs.R_OK);
	    var c = require(configFilename);
		config = Object.assign(defaults, c);
	} catch (e) {
	    config = defaults;
	}
}


var MMSocket = function(moduleName) {

	var self = this;

	if (typeof moduleName !== 'string') {
		throw new Error('Please set the module name for the MMSocket.');
	}

	self.moduleName = moduleName;

	// Private Methods
	var socketBase = (typeof window === 'undefined') ? 'http://localhost:'+config.port : '';
	socket = io(socketBase + '/' + self.moduleName);

	var notificationCallback = function() {};

	socket.on('connect', function(s) {

		// add a catch all event.
		var onevent = socket.onevent;
		socket.onevent = function (packet) {
			var args = packet.data || [];
			onevent.call (this, packet);    // original call
			packet.data = ["*"].concat(args);
			onevent.call(this, packet);      // additional call to catch-all
		};

		// register catch all.
		socket.on('*', function (notification, payload) {
			if (notification !== '*') {
				//console.log('Received notification: ' + notification +', payload: ' + payload);
				notificationCallback(notification, payload);
			}
		});


	});

	var sendNotification = function(notification, payload) {
		//console.log('Send notification: ' + notification +', payload: ' + payload);
		socket.emit(notification, payload);
	};

	// Public Methods
	this.setNotificationCallback = function(callback) {
		notificationCallback = callback;
	};

	this.sendNotification = function(notification, payload) {
		if (typeof payload === 'undefined') {
			payload = {};
		}
		sendNotification(notification, payload);
	};
};

if (typeof module !== 'undefined') {
	module.exports = MMSocket;
}