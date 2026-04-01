// Logger for MagicMirror² — works both in Node.js (CommonJS) and the browser (global).
(function () {
	if (typeof module !== "undefined") {
		if (process.env.mmTestMode !== "true") {
			const { styleText } = require("node:util");

			const LABEL_COLORS = { error: "red", warn: "yellow", debug: "bgBlue", info: "blue" };
			const MSG_COLORS = { error: "red", warn: "yellow", info: "blue" };

			const formatTimestamp = () => {
				const d = new Date();
				const pad2 = (n) => String(n).padStart(2, "0");
				const pad3 = (n) => String(n).padStart(3, "0");
				const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
				const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${pad3(d.getMilliseconds())}`;
				return `[${date} ${time}]`;
			};

			const getCallerPrefix = () => {
				try {
					const lines = new Error().stack.split("\n");
					for (const line of lines) {
						if (line.includes("node:") || line.includes("js/logger.js") || line.includes("node_modules")) continue;
						const match = line.match(/\((.+?\.js):\d+:\d+\)/) || line.match(/at\s+(.+?\.js):\d+:\d+/);
						if (match) {
							const file = match[1];
							const baseName = file.replace(/.*\/(.*)\.js/, "$1");
							const parentDir = file.replace(/.*\/(.*)\/.*\.js/, "$1");
							return styleText("gray", parentDir === "js" ? `[${baseName}]` : `[${parentDir}]`);
						}
					}
				} catch (err) { /* ignore */ }
				return styleText("gray", "[unknown]");
			};

			// Patch console methods to prepend timestamp, level label, and caller prefix.
			for (const method of ["debug", "log", "info", "warn", "error"]) {
				const original = console[method].bind(console);
				const labelRaw = `[${method.toUpperCase()}]`.padEnd(7);
				const label = LABEL_COLORS[method] ? styleText(LABEL_COLORS[method], labelRaw) : labelRaw;
				console[method] = (...args) => {
					const prefix = `${formatTimestamp()} ${label} ${getCallerPrefix()}`;
					const msgColor = MSG_COLORS[method];
					if (msgColor && args.length > 0 && typeof args[0] === "string") {
						original(prefix, styleText(msgColor, args[0]), ...args.slice(1));
					} else {
						original(prefix, ...args);
					}
				};
			}
		}
		// Node, CommonJS
		module.exports = makeLogger();
	} else {
		// Browser globals
		window.Log = makeLogger();
	}

	/**
	 * Creates the logger object. Logging is disabled when running in test mode
	 * (Node.js) or inside jsdom (browser).
	 * @returns {object} The logger object with log level methods.
	 */
	function makeLogger () {
		const enableLog = typeof module !== "undefined"
			? process.env.mmTestMode !== "true"
			: typeof window === "object" && window.name !== "jsdom";

		let logLevel;

		if (enableLog) {
			logLevel = {
				debug: console.debug.bind(console),
				log: console.log.bind(console),
				info: console.info.bind(console),
				warn: console.warn.bind(console),
				error: console.error.bind(console),
				group: console.group.bind(console),
				groupCollapsed: console.groupCollapsed.bind(console),
				groupEnd: console.groupEnd.bind(console),
				time: console.time.bind(console),
				timeEnd: console.timeEnd.bind(console),
				timeStamp: console.timeStamp.bind(console)
			};

			// Only these methods are affected by setLogLevel.
			// Utility methods (group, time, etc.) are always active.
			logLevel.setLogLevel = function (newLevel) {
				for (const key of ["debug", "log", "info", "warn", "error"]) {
					const disabled = newLevel && !newLevel.includes(key.toUpperCase());
					logLevel[key] = disabled ? function () {} : console[key].bind(console);
				}
			};
		} else {
			logLevel = {
				debug () {},
				log () {},
				info () {},
				warn () {},
				error () {},
				group () {},
				groupCollapsed () {},
				groupEnd () {},
				time () {},
				timeEnd () {},
				timeStamp () {}
			};

			logLevel.setLogLevel = function () {};
		}

		return logLevel;
	}
}());
