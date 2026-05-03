const Exec = require("node:child_process").exec;
const Spawn = require("node:child_process").spawn;

const Log = require("logger");

/*
 * class Updater
 * Allow to self updating 3rd party modules from command defined in config
 *
 * [constructor] read value in config:
 * updates: [ // array of modules update commands
 *		{
 *			<module name>: <update command>
 *		},
 * 	{
 * 		...
 * 	}
 * ],
 * updateTimeout: 2 * 60 * 1000, // max update duration
 * updateAutorestart: false // autoRestart MM when update done ?
 *
 * [main command]: parse(<Array of modules>):
 * parse if module update is needed
 * --> Apply ONLY one update (first of the module list)
 * --> auto-restart MagicMirror or wait manual restart by user
 * return array with modules update state information for `updatenotification` module displayer information
 * [
 *		{
 *			name = <module-name>, // name of the module
 *			updateCommand = <update command>, // update command (if found)
 *			inProgress = <boolean>, // an update if in progress for this module
 *			error = <boolean>, // an error if detected when updating
 *			updated = <boolean>, // updated successfully
 *			needRestart = <boolean> // manual restart of MagicMirror is required by user
 *		},
 *		{
 *			...
 * 		}
 * ]
 */

class Updater {
	constructor (config) {
		this.updates = config.updates;
		this.timeout = config.updateTimeout;
		this.autoRestart = config.updateAutorestart;
		this.moduleList = {};
		this.updating = false;
		this.version = global.version;
		this.root_path = global.root_path;
		Log.info("Updater Class Loaded!");
	}

	// [main command] parse if module update is needed
	async parse (modules) {
		var parser = modules.map(async (module) => {
			if (this.moduleList[module.module] === undefined) {
				this.moduleList[module.module] = {};
				this.moduleList[module.module].name = module.module;
				this.moduleList[module.module].updateCommand = await this.applyCommand(module.module);
				this.moduleList[module.module].inProgress = false;
				this.moduleList[module.module].error = null;
				this.moduleList[module.module].updated = false;
				this.moduleList[module.module].needRestart = false;
			}
			if (!this.moduleList[module.module].inProgress) {
				if (!this.updating) {
					if (!this.moduleList[module.module].updateCommand) {
						this.updating = false;
					} else {
						this.updating = true;
						this.moduleList[module.module].inProgress = true;
						Object.assign(this.moduleList[module.module], await this.updateProcess(this.moduleList[module.module]));
					}
				}
			}
		});

		await Promise.all(parser);
		let updater = Object.values(this.moduleList);
		Log.debug("Update Result:", updater);
		return updater;
	}

	/*
	 *  module updater with his proper command
	 *  return object as result
	 * {
	 * 	error: <boolean>, // if error detected
	 * 	updated: <boolean>, // if updated successfully
	 * 	needRestart: <boolean> // if magicmirror restart required
	 * };
	 */
	updateProcess (module) {
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
			Log.warn(`Update of ${module.name} is not supported.`);
			return Result;
		}
		Log.info(`Updating ${module.name}...`);

		return new Promise((resolve) => {
			Exec(Command, { cwd: modulePath, timeout: this.timeout }, (error, stdout) => {
				if (error) {
					Log.error(`exec error: ${error}`);
					Result.error = true;
				} else {
					Log.info(`Update logs of ${module.name}: ${stdout}`);
					Result.updated = true;
					if (this.autoRestart) {
						Log.info("Update done");
						setTimeout(() => this.nodeRestart(), 3000);
					} else {
						Log.info("Update done, don't forget to restart MagicMirror!");
						Result.needRestart = true;
					}
				}
				resolve(Result);
			});
		});
	}

	// restart MagicMirror with "node --run start"
	nodeRestart () {
		Log.info("Restarting MagicMirror...");
		const out = process.stdout;
		const err = process.stderr;
		const subprocess = Spawn("node --run start", { cwd: this.root_path, shell: true, detached: true, stdio: ["ignore", out, err] });
		subprocess.unref(); // detach the newly launched process from the master process
		process.exit();
	}

	// check if module is MagicMirror
	isMagicMirror (module) {
		if (module === "MagicMirror") return true;
		return false;
	}

	// search update module command
	applyCommand (module) {
		if (this.isMagicMirror(module.module) || !this.updates.length) return null;
		let command = null;
		this.updates.forEach((updater) => {
			if (updater[module]) command = updater[module];
		});
		return command;
	}
}

module.exports = Updater;
