// eslint-disable-next-line import-x/no-unresolved -- Socket.IO serves this module at runtime.
const { io } = await import(/* @vite-ignore */ "/socket.io/socket.io.esm.min.js");

export const MMSocket = function (moduleName) {
	if (typeof moduleName !== "string") {
		throw new Error("Please set the module name for the MMSocket.");
	}

	this.moduleName = moduleName;

	// Private Methods
	const base = globalThis.config?.basePath ?? "/";
	this.socket = io(`/${this.moduleName}`, {
		path: `${base}socket.io`,
		pingInterval: 120000, // send pings every 2 mins
		pingTimeout: 120000 // wait up to 2 mins for a pong
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

	this.sendNotification = (notification, payload = {}) => {
		this.socket.emit(notification, payload);
	};
};

// Legacy global bridge for third-party modules that reference io directly.
globalThis.io = io;

// Legacy global bridge for third-party modules that reference MMSocket directly.
if (!globalThis.MMSocket) globalThis.MMSocket = MMSocket;
