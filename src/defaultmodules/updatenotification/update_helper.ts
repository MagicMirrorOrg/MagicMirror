import { exec as Exec, spawn as Spawn } from "node:child_process";
import fs from "node:fs";

import Log from "logger";

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
	updates: any;

	timeout: any;

	autoRestart: any;

	moduleList: { [key: string]: any };

	updating: boolean;

	usePM2: boolean;

	PM2Id: any;

	version: any;

	root_path: any;

	constructor (config: any) {
		this.updates = config.updates;
		this.timeout = config.updateTimeout;
		this.autoRestart = config.updateAutorestart;
		this.moduleList = {};
		this.updating = false;
		this.usePM2 = false; // don't use pm2 by default
		this.PM2Id = null; // pm2 process number
		this.version = (global as any).version;
		this.root_path = (global as any).root_path;
		Log.info("Updater Class Loaded!");
	}

	// [main command] parse if module update is needed
	async parse (modules: any[]): Promise<any[]> {
		const parser = modules.map(async (module: any) => {
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
		const updater = Object.values(this.moduleList);
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
	updateProcess (module: any): any {
		const Result = {
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
			Exec(Command, { cwd: modulePath, timeout: this.timeout }, (error: any, stdout: any) => {
				if (error) {
					Log.error(`exec error: ${error}`);
					Result.error = true;
				} else {
					Log.info(`Update logs of ${module.name}: ${stdout}`);
					Result.updated = true;
					if (this.autoRestart) {
						Log.info("Update done");
						setTimeout(() => this.restart(), 3000);
					} else {
						Log.info("Update done, don't forget to restart MagicMirror!");
						Result.needRestart = true;
					}
				}
				resolve(Result);
			});
		});
	}

	// restart rules (pm2 or node --run start)
	restart (): void {
		if (this.usePM2) this.pm2Restart();
		else this.nodeRestart();
	}

	// restart MagicMirror with "pm2": use PM2Id for restart it
	pm2Restart (): void {
		Log.info("[PM2] restarting MagicMirror...");
		// eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy/optional runtime require
		const pm2 = require("pm2");
		pm2.restart(this.PM2Id, (err: any) => {
			if (err) {
				Log.error("[PM2] restart Error", err);
			}
		});
	}

	// restart MagicMirror with "node --run start"
	nodeRestart (): void {
		Log.info("Restarting MagicMirror...");
		const out = process.stdout;
		const err = process.stderr;
		const subprocess = Spawn("node --run start", { cwd: this.root_path, shell: true, detached: true, stdio: ["ignore", out, err] });
		subprocess.unref(); // detach the newly launched process from the master process
		process.exit();
	}

	// Check using pm2
	check_PM2_Process (): Promise<boolean> {
		Log.info("Checking PM2 using...");
		return new Promise((resolve) => {
			if (fs.existsSync("/.dockerenv")) {
				Log.info("[PM2] Running in docker container, not using PM2 ...");
				resolve(false);
				return;
			}

			if (process.env.unique_id === undefined) {
				Log.info("[PM2] You are not using pm2");
				resolve(false);
				return;
			}

			Log.debug(`[PM2] Search for pm2 id: ${process.env.pm_id} -- name: ${process.env.name} -- unique_id: ${process.env.unique_id}`);

			// eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy/optional runtime require
			const pm2 = require("pm2");
			pm2.connect((err: any) => {
				if (err) {
					Log.error("[PM2]", err);
					resolve(false);
					return;
				}
				pm2.list((err: any, list: any[]) => {
					if (err) {
						Log.error("[PM2] Can't get process List!");
						resolve(false);
						return;
					}
					list.forEach((pm: any) => {
						Log.debug(`[PM2] found pm2 process id: ${pm.pm_id} -- name: ${pm.name} -- unique_id: ${pm.pm2_env.unique_id}`);
						if (pm.pm2_env.status === "online" && process.env.name === pm.name && +process.env.pm_id! === +pm.pm_id && process.env.unique_id === pm.pm2_env.unique_id) {
							this.PM2Id = pm.pm_id;
							this.usePM2 = true;
							Log.info(`[PM2] You are using pm2 with id: ${this.PM2Id} (${pm.name})`);
							resolve(true);
						} else {
							Log.debug(`[PM2] pm2 process id: ${pm.pm_id} don't match...`);
						}
					});
					pm2.disconnect();
					if (!this.usePM2) {
						Log.info("[PM2] You are not using pm2");
						resolve(false);
					}
				});
			});
		});
	}

	// check if module is MagicMirror
	isMagicMirror (module: any): boolean {
		if (module === "MagicMirror") return true;
		return false;
	}

	// search update module command
	applyCommand (module: any): any {
		if (this.isMagicMirror(module.module) || !this.updates.length) return null;
		let command = null;
		this.updates.forEach((updater: any) => {
			if (updater[module]) command = updater[module];
		});
		return command;
	}
}

export = Updater;
