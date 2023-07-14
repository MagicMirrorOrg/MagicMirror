const Exec = require("child_process").exec;
const Spawn = require("child_process").spawn;
const pm2 = require("pm2");
const Log = require("logger");

class Updater {
	constructor(config, callback) {
		this.updates = config.updates;
		this.timeout = config.updateTimeout;
		this.autoRestart = config.updateAutorestart;
		this.callback = callback;
		this.moduleList = {};
		this.updating = false;
		this.usePM2 = false;
		this.PM2 = null;
		this.version = global.version;
		this.root_path = global.root_path;
		Log.info("Updater Class Loaded!");
	}

	add(modules) {
		modules.forEach(async (module) => {
			if (module.behind > 0) {
				if (this.moduleList[module.module] === undefined) {
					this.moduleList[module.module] = {};
					this.moduleList[module.module].name = module.module;
					this.moduleList[module.module].updateCommand = await this.applyCommand(module.module);
					this.moduleList[module.module].neverUpdated = true;
				}
				if (this.moduleList[module.module].neverUpdated) {
					if (!this.updating) {
						if (!this.moduleList[module.module].updateCommand) {
							this.updating = false;
						} else {
							this.updateProcess(this.moduleList[module.module]);
							this.updating = true;
						}
					}
					this.moduleList[module.module].neverUpdated = false;
				}
			} else if (module.behind === 0) {
				if (this.moduleList[module.module] !== undefined) delete this.moduleList[module.module];
			}
			//Log.info("updatenotification Result:", this.moduleList[module.module])
		});
	}

	updateProcess(module) {
		let Command = null;
		const Path = `${this.root_path}/modules/`;
		const modulePath = Path + module.name;

		if (module.updateCommand) {
			Command = module.updateCommand;
		} else {
			return Log.warn(`updatenotification: Update of ${module.name} is not supported.`);
		}
		Log.info(`updatenotification: Updating ${module.name}...`);

		Exec(Command, { cwd: modulePath, timeout: this.timeout }, (error, stdout, stderr) => {
			if (error) {
				Log.error(`updatenotification: exec error: ${error}`);
				this.callback("UPDATE_ERROR", module.name);
			} else {
				Log.info(`updatenotification: Update logs of ${module.name}: ${stdout}`);
				this.callback("UPDATED", module.name);
				if (this.autoRestart) {
					Log.info("updatenotification:: Process update done");
					setTimeout(() => this.restart(), 3000);
				} else {
					Log.info("updatenotification: Process update done, don't forget to restart MagicMirror!");
					this.callback("NEEDRESTART");
				}
			}
		});
	}

	restart() {
		if (this.usePM2) {
			pm2.restart(this.PM2, (err, proc) => {
				if (err) {
					Log.error("updatenotification:[PM2] restart Error", err);
				}
			});
		} else this.doRestart();
	}

	doRestart() {
		Log.info("updatenotification: Restarting MagicMirror...");
		const out = process.stdout;
		const err = process.stderr;
		const subprocess = Spawn("npm start", { cwd: this.root_path, shell: true, detached: true, stdio: ["ignore", out, err] });
		subprocess.unref();
		process.exit();
	}

	check_PM2_Process() {
		return new Promise((resolve) => {
			pm2.connect((err) => {
				if (err) {
					Log.error("updatenotification [PM2]", err);
					this.usePM2 = false;
					resolve(false);
				}
				pm2.list((err, list) => {
					if (err) {
						Log.error("updatenotification [PM2]", err);
						this.usePM2 = false;
						resolve(false);
					}
					list.forEach((pm) => {
						if (pm.pm2_env.version === this.version && pm.pm2_env.status === "online" && pm.pm2_env.PWD.includes(this.root_path)) {
							this.PM2 = pm.name;
							this.usePM2 = true;
							Log.info("updatenotification: You are using pm2 with", this.PM2);
							resolve(true);
						}
					});
					pm2.disconnect();
					if (!this.PM2) {
						Log.info("updatenotification: You are not using pm2");
						this.usePM2 = false;
						resolve(false);
					}
				});
			});
		});
	}

	canBeUpdated(module) {
		if (module === "MagicMirror") return false;
		return true;
	}

	applyCommand(module) {
		if (!this.canBeUpdated(module.module)) return null;
		let command = null;
		this.updates.forEach((updater) => {
			if (updater[module]) command = updater[module];
		});
		return command;
	}
}

module.exports = Updater;
