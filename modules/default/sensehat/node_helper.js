const { spawn } = require("child_process");
const path = require("path");
const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
	start () {
		this.config = null;
		this.updateTimer = null;
		this.pythonPath = "python3"; // most Pis use python3
		this.readerPath = path.join(__dirname, "python", "reader.py");
		Log.info("[sensehat] Node helper started");
	},

	stop () {
		if (this.updateTimer) {
			clearInterval(this.updateTimer);
			this.updateTimer = null;
		}
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "SENSEHAT_CONFIG") {
			this.config = payload || {};
			Log.info("[sensehat] Configuration received");
			this._setupPolling();

			// optional: set initial LED state
			if (this.config.ledMatrixEnabled) {
				this._handleLedCommand({ mode: this.config.ledMode || "status", color: this.config.ledColor || [0, 255, 0], text: this.config.ledText || "" });
			}
		} else if (notification === "SENSEHAT_LED_COMMAND") {
			this._handleLedCommand(payload || {});
		}
	},

	_setupPolling () {
		if (this.updateTimer) {
			clearInterval(this.updateTimer);
			this.updateTimer = null;
		}
		const interval = Math.max(1000, parseInt(this.config.updateInterval || 5000, 10));
		// Poll immediately, then on interval
		this._pollOnce();
		this.updateTimer = setInterval(() => this._pollOnce(), interval);
		Log.info(`[sensehat] Polling every ${interval} ms`);
	},

	_pollOnce () {
		const args = [this.readerPath, "--read"]; // explicit --read
		const child = spawn(this.pythonPath, args, { cwd: path.dirname(this.readerPath) });

		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (d) => (stdout += d.toString()));
		child.stderr.on("data", (d) => (stderr += d.toString()));
		child.on("error", (err) => {
			Log.error(`[sensehat] Failed to spawn Python: ${err.message}`);
		});

		child.on("close", (code) => {
			if (stderr && (this.config && this.config.debug)) {
				Log.warn(`[sensehat] python stderr: ${stderr.trim()}`);
			}
			if (code !== 0 && !stdout) {
				Log.warn(`[sensehat] Python exited with code ${code}`);
				return;
			}
			try {
				const data = JSON.parse(stdout.trim());
				if (data && data.error) {
					Log.warn(`[sensehat] Python reported error: ${data.error}`);
					// Forward error payload to frontend so UI can display it
					this.sendSocketNotification("SENSEHAT_DATA", data);
					return;
				}
				this.sendSocketNotification("SENSEHAT_DATA", data);
			} catch (e) {
				Log.warn(`[sensehat] Invalid JSON from python: ${e.message}. Raw: ${stdout.trim()}`);
			}
		});
	},

	_handleLedCommand (cmd) {
		if (!this.config || !this.config.ledMatrixEnabled) return;

		const args = [this.readerPath];
		if (cmd.clear || cmd.mode === "off") {
			args.push("--clear");
		} else if (cmd.mode === "text") {
			args.push("--mode", "text");
			if (cmd.text) {
				args.push("--text", String(cmd.text));
			}
			const color = Array.isArray(cmd.color) ? cmd.color : this.config.ledColor || [255, 255, 255];
			args.push("--color", color.join(","));
		} else {
			// status mode
			args.push("--mode", "status");
			const color = Array.isArray(cmd.color) ? cmd.color : this.config.ledColor || [0, 255, 0];
			args.push("--color", color.join(","));
		}

		const child = spawn(this.pythonPath, args, { cwd: path.dirname(this.readerPath) });
		let stderr = "";
		child.stderr.on("data", (d) => (stderr += d.toString()));
		child.on("close", (code) => {
			if (code !== 0) {
				Log.warn(`[sensehat] LED command failed with code ${code}. ${stderr.trim()}`);
			} else if (this.config && this.config.debug && stderr.trim()) {
				Log.warn(`[sensehat] LED command stderr: ${stderr.trim()}`);
			}
		});
	}
});
