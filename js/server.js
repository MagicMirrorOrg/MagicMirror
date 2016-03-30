/* Magic Mirror
 * Server
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');

var Server = function(config, callback) {

	/* createNamespace(namespace)
	 * Creates a namespace with a wildcard event.
	 *
	 * argument namespace string - The name of the namespace.
	 */
	var createNamespace = function(namespace) {
		console.log('Creating socket namespace: ' + namespace);

		io.of(namespace).on('connection', function (socket) {
			console.log("New socket connection on namespace: " + namespace);

			// add a catch all event.
			var onevent = socket.onevent;
			socket.onevent = function (packet) {
				var args = packet.data || [];
				onevent.call (this, packet);    // original call
				packet.data = ["*"].concat(args);
				onevent.call(this, packet);      // additional call to catch-all
			};

			// register catch all.
			socket.on('*', function (event, data) {
				io.of(namespace).emit(event, data);
			});
		});
	};

	/* createNamespaces()
	 * Creates a namespace for all modules in the config.
	 */
	var createNamespaces = function() {
		var modules = [];
		var m;

		for (m in config.modules) {
			var module = config.modules[m];
			if (modules.indexOf(module.module) === -1) {
				modules.push(module.module);
			}
		}

		for (m in modules) {
			createNamespace(modules[m]);
		}
	};

	console.log("Starting server op port " + config.port + " ... ");

	server.listen(config.port);
	app.use('/js', express.static(__dirname));
	app.use('/config', express.static(path.resolve(__dirname + '/../config')));
	app.use('/css', express.static(path.resolve(__dirname + '/../css')));
	app.use('/fonts', express.static(path.resolve(__dirname + '/../fonts')));
	app.use('/modules', express.static(path.resolve(__dirname + '/../modules')));
	app.use('/vendor', express.static(path.resolve(__dirname + '/../vendor')));

	app.get('/', function (req, res) {
	  res.sendFile(path.resolve(__dirname + '/../index.html'));
	});

	createNamespaces();

	if (typeof callback === 'function') {
		callback();
	}
};

module.exports = Server;