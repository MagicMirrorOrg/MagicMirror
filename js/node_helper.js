const express = require("express");
const Log = require("logger");
const Class = require("./class");

const NodeHelper = Class.extend({
	init () {
		Log.log("Initializing new module helper ...");
	},

	loaded () {
		Log.log(`Module helper loaded: ${this.name}`);
	},

	start () {
		Log.log(`Starting module helper: ${this.name}`);
	},

	/**
	 * Called when the MagicMirror² server receives a `SIGINT`
	 * Close any open connections, stop any sub-processes and
	 * gracefully exit the module.
	 */
	stop () {
		Log.log(`Stopping module helper: ${this.name}`);
	},

	/**
	 * This method is called when a socket notification arrives.
	 * @param {string} notification The identifier of the notification.
	 * @param {*}  payload The payload of the notification.
	 */
	socketNotificationReceived (notification, payload) {
		Log.log(`${this.name} received a socket notification: ${notification} - Payload: ${payload}`);
	},

	/**
	 * Set the module name.
	 * @param {string} name Module name.
	 */
	setName (name) {
		this.name = name;
	},

	/**
	 * Set the module path.
	 * @param {string} path Module path.
	 */
	setPath (path) {
		this.path = path;
	},

	/*
	 * sendSocketNotification(notification, payload)
	 * Send a socket notification to the node helper.
	 *
	 * argument notification string - The identifier of the notification.
	 * argument payload mixed - The payload of the notification.
	 */
	sendSocketNotification (notification, payload) {
		this.io.of(this.name).emit(notification, payload);
	},

	/*
	 * setExpressApp(app)
	 * Sets the express app object for this module.
	 * This allows you to host files from the created webserver.
	 *
	 * argument app Express app - The Express app object.
	 */
	setExpressApp (app) {
		this.expressApp = app;

		app.use(`/${this.name}`, express.static(`${this.path}/public`));
	},

	/*
	 * setSocketIO(io)
	 * Sets the socket io object for this module.
	 * Binds message receiver.
	 *
	 * argument io Socket.io - The Socket io object.
	 */
	setSocketIO (io) {
		this.io = io;

		Log.log(`Connecting socket for: ${this.name}`);

		io.of(this.name).on("connection", (socket) => {
			// register catch all.
			socket.onAny((notification, payload) => {
				this.socketNotificationReceived(notification, payload);
			});
		});
	}
});

NodeHelper.checkFetchStatus = function (response) {
	// response.status >= 200 && response.status < 300
	if (response.ok) {
		return response;
	} else {
		throw Error(response.statusText);
	}
};

/**
 * Look at the specified error and return an appropriate error type, that
 * can be translated to a detailed error message
 * @param {Error} error the error from fetching something
 * @returns {string} the string of the detailed error message in the translations
 */
NodeHelper.checkFetchError = function (error) {
	let error_type = "MODULE_ERROR_UNSPECIFIED";
	if (error.code === "EAI_AGAIN") {
		error_type = "MODULE_ERROR_NO_CONNECTION";
	} else if (error.message === "Unauthorized") {
		error_type = "MODULE_ERROR_UNAUTHORIZED";
	}
	return error_type;
};

NodeHelper.create = function (moduleDefinition) {
	return NodeHelper.extend(moduleDefinition);
};

module.exports = NodeHelper;
