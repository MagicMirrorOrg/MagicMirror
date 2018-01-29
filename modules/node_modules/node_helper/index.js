/* Magic Mirror
 * Node Helper Superclass
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var Class = require("../../../js/class.js");
var express = require("express");
var path = require("path");

NodeHelper = Class.extend({
	init: function() {
		console.log("Initializing new module helper ...");
	},

	loaded: function(callback) {
		console.log("Module helper loaded: " + this.name);
		callback();
	},

	start: function() {
		console.log("Starting module helper: " + this.name);
	},

	/* stop()
	 * Called when the MagicMirror server receives a `SIGINT`
	 * Close any open connections, stop any sub-processes and
	 * gracefully exit the module.
	 *
	 */
	stop: function() {
		console.log("Stopping module helper: " + this.name);
	},

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the notification.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: function(notification, payload) {
		console.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
	},

	/* setName(name)
	 * Set the module name.
	 *
	 * argument name string - Module name.
	 */
	setName: function(name) {
		this.name = name;
	},

	/* setPath(path)
	 * Set the module path.
	 *
	 * argument path string - Module path.
	 */
	setPath: function(path) {
		this.path = path;
	},

	/* sendSocketNotification(notification, payload)
	 * Send a socket notification to the node helper.
	 *
	 * argument notification string - The identifier of the notification.
	 * argument payload mixed - The payload of the notification.
	 */
	sendSocketNotification: function(notification, payload) {
		this.io.of(this.name).emit(notification, payload);
	},

	/* setExpressApp(app)
	 * Sets the express app object for this module.
	 * This allows you to host files from the created webserver.
	 *
	 * argument app Express app - The Express app object.
	 */
	setExpressApp: function(app) {
		this.expressApp = app;

		var publicPath = this.path + "/public";
		app.use("/" + this.name, express.static(publicPath));
	},

	/* setSocketIO(io)
	 * Sets the socket io object for this module.
	 * Binds message receiver.
	 *
	 * argument io Socket.io - The Socket io object.
	 */
	setSocketIO: function(io) {
		var self = this;
		self.io = io;

		console.log("Connecting socket for: " + this.name);
		var namespace = this.name;
		io.of(namespace).on("connection", function(socket) {
			// add a catch all event.
			var onevent = socket.onevent;
			socket.onevent = function(packet) {
				var args = packet.data || [];
				onevent.call(this, packet);    // original call
				packet.data = ["*"].concat(args);
				onevent.call(this, packet);      // additional call to catch-all
			};

			// register catch all.
			socket.on("*", function(notification, payload) {
				if (notification !== "*") {
					//console.log('received message in namespace: ' + namespace);
					self.socketNotificationReceived(notification, payload);
				}
			});
		});

	}
});

NodeHelper.create = function(moduleDefinition) {
	return NodeHelper.extend(moduleDefinition);
};

module.exports = NodeHelper;
