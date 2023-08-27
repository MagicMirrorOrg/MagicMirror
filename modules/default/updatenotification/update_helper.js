const Exec = require("child_process").exec;
const Spawn = require("child_process").spawn;
const commandExists = require("command-exists");
const Log = require("logger");

/** @todo comment how this class work */
/** Soon... */

class Updater {
	constructor(config) {
		this.updates = config.updates;
		this.timeout = config.updateTimeout;
		this.autoRestart = config.updateAutorestart;
		this.moduleList = {};
		this.updating = false;
		this.usePM2 = false;
		this.PM2 = null;
		this.version = global.version;
		this.root_path = global.root_path;
		Log.info("updatenotification: Updater Class Loaded!");
	}

	async parse(modules) {
		var parser = modules.map(async (module) => {
			if (this.moduleList[module.module] === undefined) {
				this.moduleList[module.module] = {};
				this.moduleList[module.module].name = module.module;
				this.moduleList[module.module].updateCommand = await this.applyCommand(module.module);
				(this.moduleList[module.module].inProgress = false), (this.moduleList[module.module].error = null);
				(this.moduleList[module.module].updated = false), (this.moduleList[module.module].needRestart = false);
			}
			if (!this.moduleList[module.module].inProgress) {
				if (!this.updating) {
					if (!this.moduleList[module.module].updateCommand) {
						this.updating = false;
					} else {
						this.updating = true;
						(this.moduleList[module.module].inProgress = true), Object.assign(this.moduleList[module.module], await this.updateProcess(this.moduleList[module.module]));
					}
				}
			}
		});

		await Promise.all(parser);
		let updater = Object.values(this.moduleList);
		Log.debug("updatenotification Update Result:", updater);
		return updater;
	}

	updateProcess(module) {
		let Result = {
			error: false,
			updated: false,
			needRestart: false
		};
		let Command = null;
		const Path = `${this.root_path}/modules/`;
		const modulePath = Path + module.name;

		if (module.updateCommand) {
			Command = module.updateCommand;
		} else {
			Log.warn(`updatenotification: Update of ${module.name} is not supported.`);
			return Result;
		}
		Log.info(`updatenotification: Updating ${module.name}...`);

		return new Promise((resolve) => {
			Exec(Command, { cwd: modulePath, timeout: this.timeout }, (error, stdout, stderr) => {
				if (error) {
					Log.error(`updatenotification: exec error: ${error}`);
					Result.error = true;
				} else {
					Log.info(`updatenotification: Update logs of ${module.name}: ${stdout}`);
					Result.updated = true;
					if (this.autoRestart) {
						Log.info("updatenotification: Update done");
						setTimeout(() => this.restart(), 3000);
					} else {
						Log.info("updatenotification: Update done, don't forget to restart MagicMirror!");
						Result.needRestart = true;
					}
				}
				resolve(Result);
			});
		});
	}

	restart() {
		if (this.usePM2) {
			Log.info("updatenotification: PM2 will restarting MagicMirror...");
			Exec(`pm2 restart ${this.PM2}`, (err, std, sde) => {
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

	// Check using pm2
	check_PM2_Process() {
		Log.info("updatenotification: Checking PM2 using...");
		return new Promise((resolve) => {
			commandExists("pm2")
				.then(async () => {
					var PM2_List = await this.PM2_GetList();
					if (!PM2_List) {
						Log.error("updatenotification: [PM2] Can't get process List!");
						this.usePM2 = false;
						resolve(false);
						return;
					}
					PM2_List.forEach((pm) => {
						if (pm.pm2_env.version === this.version && pm.pm2_env.status === "online" && pm.pm2_env.PWD.includes(this.root_path)) {
							this.PM2 = pm.name;
							this.usePM2 = true;
							Log.info("updatenotification: You are using pm2 with", this.PM2);
							resolve(true);
						}
					});
					if (!this.PM2) {
						Log.info("updatenotification: You are not using pm2");
						this.usePM2 = false;
						resolve(false);
					}
				})
				.catch(() => {
					Log.info("updatenotification: You are not using pm2");
					this.usePM2 = false;
					resolve(false);
				});
		});
	}

	// Get the list of pm2 process
	PM2_GetList() {
		return new Promise((resolve) => {
			Exec("pm2 jlist", (err, std, sde) => {
				if (err) {
					resolve(null);
					return;
				}
				let result = JSON.parse(std);
				resolve(result);
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
