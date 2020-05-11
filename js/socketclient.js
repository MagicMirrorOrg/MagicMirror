/* global io */

/* Magic Mirror
 * TODO add description
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
var MMSocket = function (moduleName) {
	var self = this;

	if (typeof moduleName !== "string") {
		throw new Error("Please set the module name for the MMSocket.");
	}

	self.moduleName = moduleName;

	// Private Methods
	var base = "/";
	if (typeof config !== "undefined" && typeof config.basePath !== "undefined") {
		base = config.basePath;
	}
	self.socket = io("/" + self.moduleName, {
		path: base + "socket.io"
	});
	var notificationCallback = function () {};

	var onevent = self.socket.onevent;
	self.socket.onevent = function (packet) {
		var args = packet.data || [];
		onevent.call(this, packet); // original call
		packet.data = ["*"].concat(args);
		onevent.call(this, packet); // additional call to catch-all
	};

	// register catch all.
	self.socket.on("*", function (notification, payload) {
		if (notification !== "*") {
			notificationCallback(notification, payload);
		}
	});

	// Public Methods
	this.setNotificationCallback = function (callback) {
		notificationCallback = callback;
	};

	this.sendNotification = function (notification, payload) {
		if (typeof payload === "undefined") {
			payload = {};
		}
		self.socket.emit(notification, payload);
	};
};
