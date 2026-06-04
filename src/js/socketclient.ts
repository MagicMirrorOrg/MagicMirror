/* global io */

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- MMSocket is a runtime global consumed by other browser scripts.
const MMSocket = function (this: any, moduleName: string) {
	if (typeof moduleName !== "string") {
		throw new Error("Please set the module name for the MMSocket.");
	}

	this.moduleName = moduleName;

	// Private Methods
	let base = "/";
	if (typeof config !== "undefined" && config.basePath !== undefined) {
		base = config.basePath;
	}
	this.socket = io(`/${this.moduleName}`, {
		path: `${base}socket.io`,
		pingInterval: 120000, // send pings every 2 mins
		pingTimeout: 120000 // wait up to 2 mins for a pong
	});

	let notificationCallback: (notification: string, payload: any) => void = function () { /* no-op */ };

	const onevent = this.socket.onevent;
	this.socket.onevent = (packet: any) => {
		const args = packet.data || [];
		onevent.call(this.socket, packet); // original call
		packet.data = ["*"].concat(args);
		onevent.call(this.socket, packet); // additional call to catch-all
	};

	// register catch all.
	this.socket.on("*", (notification: string, payload: any) => {
		if (notification !== "*") {
			notificationCallback(notification, payload);
		}
	});

	// Public Methods
	this.setNotificationCallback = (callback: (notification: string, payload: any) => void) => {
		notificationCallback = callback;
	};

	this.sendNotification = (notification: string, payload: any = {}) => {
		this.socket.emit(notification, payload);
	};
};
