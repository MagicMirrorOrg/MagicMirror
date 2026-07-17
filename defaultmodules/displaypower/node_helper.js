const { exec, execSync } = require("node:child_process");
const NodeHelper = require("node_helper");
const Log = require("logger");
const { Cron } = require("croner");

module.exports = NodeHelper.create({
	config: {},
	jobs: [],
	driver: null,
	displayOutput: null,

	start () {
		Log.log("Starting node_helper for: displaypower");
	},

	socketNotificationReceived (notification, payload) {
		switch (notification) {
			case "CONFIG":
				this.config = payload;
				this.driver = this.detectDriver();
				this.displayOutput = this.detectOutput();
				Log.log(`displaypower: using driver "${this.driver}", output "${this.displayOutput}"`);
				this.scheduleAll();
				break;
			case "SET_POWER":
				this.setPower(payload.action);
				break;
		}
	},

	detectDriver () {
		if (this.config.driver && this.config.driver !== "auto") {
			return this.config.driver;
		}
		if (process.env.WAYLAND_DISPLAY) {
			if (this.commandExists("wlopm")) return "wlopm";
			if (this.commandExists("wlr-randr")) return "wlr-randr";
			return "vcgencmd";
		}
		if (process.env.DISPLAY) {
			return "x11";
		}
		return "vcgencmd";
	},

	detectOutput () {
		if (this.config.display) return this.config.display;

		// Try to auto-detect the first connected output via wlr-randr
		if (this.driver === "wlr-randr" || this.driver === "wlopm") {
			try {
				const raw = execSync("wlr-randr 2>/dev/null", { timeout: 2000 }).toString();
				const match = raw.match(/^(\S+)/m);
				if (match) return match[1];
			} catch (e) {
				// fall through to default
			}
		}

		return "HDMI-A-1";
	},

	commandExists (cmd) {
		try {
			execSync(`which ${cmd}`, { timeout: 1000, stdio: "ignore" });
			return true;
		} catch (e) {
			return false;
		}
	},

	scheduleAll () {
		this.jobs.forEach((job) => job.stop());
		this.jobs = [];

		if (!Array.isArray(this.config.schedule) || this.config.schedule.length === 0) return;

		for (const entry of this.config.schedule) {
			const job = new Cron(entry.time, () => {
				this.setPower(entry.action);
			});
			this.jobs.push(job);
			Log.log(`displaypower: scheduled "${entry.action}" at "${entry.time}"`);
		}
	},

	setPower (action) {
		const cmd = this.buildCommand(action);
		if (!cmd) {
			Log.warn(`displaypower: no command available for driver "${this.driver}"`);
			return;
		}
		Log.log(`displaypower: running: ${cmd}`);
		exec(cmd, (err) => {
			if (err) {
				Log.error(`displaypower: command failed — ${err.message}`);
				return;
			}
			this.sendSocketNotification("POWER_STATE", { on: action === "on" });
		});
	},

	buildCommand (action) {
		const on = action === "on";
		switch (this.driver) {
			case "wlopm":
				return `wlopm --${on ? "on" : "off"} "${this.displayOutput}"`;
			case "wlr-randr":
				return `wlr-randr --output "${this.displayOutput}" ${on ? "--on" : "--off"}`;
			case "x11":
				return `xset -display ${process.env.DISPLAY || ":0"} dpms force ${on ? "on" : "off"}`;
			case "vcgencmd":
				return `vcgencmd display_power ${on ? "1" : "0"}`;
			default:
				return null;
		}
	},

	stop () {
		this.jobs.forEach((job) => job.stop());
		this.jobs = [];
	}
});
