import express from "express";
import Log from "logger";
import { replaceSecretPlaceholder } from "./server_functions";

class NodeHelper {
	// All assigned at runtime (via setName/setPath/setExpressApp/setSocketIO); declared
	// for typing only so they are not emitted as instance fields.
	declare name: string;

	declare path: string;

	declare expressApp: any;

	declare io: any;

	declare _super: any;

	init (): void {
		Log.log("Initializing new module helper ...");
	}

	loaded (): void {
		Log.log(`Module helper loaded: ${this.name}`);
	}

	start (): void {
		Log.log(`Starting module helper: ${this.name}`);
	}

	/**
	 * Called when the MagicMirror² server receives a `SIGINT`
	 * Close any open connections, stop any sub-processes and
	 * gracefully exit the module.
	 */
	stop (): void {
		Log.log(`Stopping module helper: ${this.name}`);
	}

	/**
	 * This method is called when a socket notification arrives.
	 * @param {string} notification The identifier of the notification.
	 * @param {object} payload The payload of the notification.
	 */
	socketNotificationReceived (notification: string, payload: any): void {
		Log.log(`${this.name} received a socket notification: ${notification} - Payload: ${payload}`);
	}

	/**
	 * Set the module name.
	 * @param {string} name Module name.
	 */
	setName (name: string): void {
		this.name = name;
	}

	/**
	 * Set the module path.
	 * @param {string} path Module path.
	 */
	setPath (path: string): void {
		this.path = path;
	}

	/*
	 * sendSocketNotification(notification, payload)
	 * Send a socket notification to the node helper.
	 *
	 * argument notification string - The identifier of the notification.
	 * argument payload mixed - The payload of the notification.
	 */
	sendSocketNotification (notification: string, payload: any): void {
		this.io.of(this.name).emit(notification, payload);
	}

	/*
	 * setExpressApp(app)
	 * Sets the express app object for this module.
	 * This allows you to host files from the created webserver.
	 *
	 * argument app Express app - The Express app object.
	 */
	setExpressApp (app: any): void {
		this.expressApp = app;

		app.use(`/${this.name}`, express.static(`${this.path}/public`));
	}

	/*
	 * setSocketIO(io)
	 * Sets the socket io object for this module.
	 * Binds message receiver.
	 *
	 * argument io Socket.io - The Socket io object.
	 */
	setSocketIO (io: any): void {
		this.io = io;

		Log.log(`Connecting socket for: ${this.name}`);

		io.of(this.name).on("connection", (socket: any) => {
			// register catch all.
			socket.onAny((notification: string, payload: any) => {
				if (config?.hideConfigSecrets && payload && typeof payload === "object") {
					try {
						const payloadStr = replaceSecretPlaceholder(JSON.stringify(payload));
						this.socketNotificationReceived(notification, JSON.parse(payloadStr));
					} catch (e) {
						Log.error("Error substituting variables in payload: ", e);
						this.socketNotificationReceived(notification, payload);
					}
				} else {
					this.socketNotificationReceived(notification, payload);
				}
			});
		});
	}

	static checkFetchStatus (response: any): any {
		// response.status >= 200 && response.status < 300
		if (response.ok) {
			return response;
		} else {
			throw Error(response.statusText);
		}
	}

	/**
	 * Look at the specified error and return an appropriate error type, that
	 * can be translated to a detailed error message
	 * @param {Error} error the error from fetching something
	 * @returns {string} the string of the detailed error message in the translations
	 */
	static checkFetchError (error: any): string {
		let error_type = "MODULE_ERROR_UNSPECIFIED";
		if (error.code === "EAI_AGAIN") {
			error_type = "MODULE_ERROR_NO_CONNECTION";
		} else {
			const message = typeof error.message === "string" ? error.message.toLowerCase() : "";
			if (message.includes("unauthorized") || message.includes("http 401") || message.includes("http 403")) {
				error_type = "MODULE_ERROR_UNAUTHORIZED";
			}
		}
		return error_type;
	}

	/**
	 * Build a NodeHelper subclass from a module's definition object, applying its
	 * members over the base. A method that references `this._super` is wrapped so
	 * `_super()` calls the overridden base method — the same contract the previous
	 * Class.extend (John Resig) inheritance provided.
	 * @param {object} definition The node helper definition object.
	 * @returns {typeof NodeHelper} A NodeHelper subclass.
	 */
	static extend (definition: any): typeof NodeHelper {
		// Module node helpers extend the NodeHelper base exactly one level deep.
		class Subclass extends NodeHelper {}
		const prototype: any = Subclass.prototype;
		const parentPrototype: any = NodeHelper.prototype;

		for (const name in definition) {
			const value = definition[name];
			if (typeof value === "function" && typeof parentPrototype[name] === "function" && (/\b_super\b/).test(Function.prototype.toString.call(value))) {
				prototype[name] = (function (methodName, fn) {
					return function (this: any, ...args: any[]) {
						const tmp = this._super;

						// Temporarily expose the overridden base method as this._super().
						this._super = parentPrototype[methodName];
						const ret = fn.apply(this, args);
						this._super = tmp;

						return ret;
					};
				}(name, value));
			} else {
				prototype[name] = value;
			}
		}

		return Subclass;
	}

	/**
	 * Create a node helper class from a module definition. Returns the constructor;
	 * the caller (js/app.js) instantiates it with `new`.
	 * @param {object} moduleDefinition The node helper definition object.
	 * @returns {typeof NodeHelper} A NodeHelper subclass.
	 */
	static create (moduleDefinition: any): typeof NodeHelper {
		return NodeHelper.extend(moduleDefinition);
	}

	/**
	 * Instantiate the node helper — runs the (overridable) init method.
	 */
	constructor () {
		if (this.init) {
			this.init();
		}
	}
}

export = NodeHelper;
