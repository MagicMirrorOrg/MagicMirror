/* global io */

/* MagicMirror²
 * TODO add description
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
const MMSocket = function (moduleName) {
	if (typeof moduleName !== "string") {
		throw new Error("Please set the module name for the MMSocket.");
	}

	this.moduleName = moduleName;

	// Private Methods
	let base = "/";
	if (typeof config !== "undefined" && typeof config.basePath !== "undefined") {
		base = config.basePath;
	}
	this.socket = io("/" + this.moduleName, {
		path: base + "socket.io"
	});

	let notificationCallback = function () {};

	const onevent = this.socket.onevent;
	this.socket.onevent = (packet) => {
		const args = packet.data || [];
		onevent.call(this.socket, packet); // original call
		packet.data = ["*"].concat(args);
		onevent.call(this.socket, packet); // additional call to catch-all
	};

	// register catch all.
	this.socket.on("*", (notification, payload) => {
		if (notification !== "*") {
			notificationCallback(notification, payload);
		}
	});

	// Public Methods
	this.setNotificationCallback = (callback) => {
		notificationCallback = callback;
	};

	this.sendNotification = (notification, payload) => {
		if (typeof payload === "undefined") {
			payload = {};
		}
		this.socket.emit(notification, payload);
	};
};
