import {exec, spawn} from "node:child_process";
import Log from "../../js/logger.js";

/**
 * Updates third-party modules from commands defined in the configuration.
 *
 * Only one module is updated at a time. Each update result reports whether the
 * update succeeded and whether MagicMirror needs to be restarted.
 */
class Updater {

	/**
	 * @param {object} config Update configuration.
	 * @param {Array<object>} config.updates Configured update commands.
	 * @param {number} config.updateTimeout Maximum update duration in milliseconds.
	 * @param {boolean} config.updateAutorestart Whether to restart after an update.
	 */
	constructor (config) {
		this.updates = config.updates;
		this.timeout = config.updateTimeout;
		this.autoRestart = config.updateAutorestart;
		this.moduleList = {};
		this.updating = false;
		this.version = global.version;
		this.rootPath = global.root_path;
		Log.info("Updater Class Loaded!");
	}

	/**
	 * Parse modules and apply the first available update.
	 * @param {Array<{module: string}>} modules Modules that may have updates.
	 * @returns {Promise<Array<object>>} The current update state for each module.
	 */
	async parse (modules) {
		await Promise.all(modules.map((module) => this.processModule(module)));
		const updater = Object.values(this.moduleList);
		Log.debug("Update Result:", updater);
		return updater;
	}

	/**
	 * Initialize and process one module update.
	 * @param {{module: string}} module Module to process.
	 * @returns {Promise<void>} Resolves when processing is complete.
	 */
	async processModule (module) {
		const moduleState = await this.getModuleState(module);
		if (moduleState.inProgress || this.updating || !moduleState.updateCommand) {
			return;
		}

		this.updating = true;
		moduleState.inProgress = true;
		Object.assign(moduleState, await this.updateProcess(moduleState));
	}

	/**
	 * Return the cached state for a module, creating it when necessary.
	 * @param {{module: string}} module Module to initialize.
	 * @returns {Promise<object>} Cached module update state.
	 */
	async getModuleState (module) {
		if (!(module.module in this.moduleList)) {
			this.moduleList[module.module] = {
				name: module.module,
				updateCommand: await this.applyCommand(module.module),
				inProgress: false,
				error: null,
				updated: false,
				needRestart: false
			};
		}

		return this.moduleList[module.module];
	}

	/**
	 * Run the update command for a module and return its update state.
	 * @param {{name: string, updateCommand: string|null}} module Module to update.
	 * @returns {object|Promise<object>} The update result, or a promise for it.
	 */
	updateProcess (module) {
		const Result = {
			error: false,
			updated: false,
			needRestart: false
		};
		let Command = null;
		const Path = `${this.rootPath}/modules/`,
			modulePath = Path + module.name;

		if (module.updateCommand) {
			Command = module.updateCommand;
		} else {
			Log.warn(`Update of ${module.name} is not supported.`);
			return Result;
		}
		Log.info(`Updating ${module.name}...`);

		return new Promise((resolve) => {
			exec(Command, {cwd: modulePath,
				timeout: this.timeout}, (error, stdout) => {
				if (error) {
					Log.error(`exec error: ${error}`);
					Result.error = true;
				} else {
					this.handleUpdateSuccess(module, Result, stdout);
				}
				resolve(Result);
			});
		});
	}

	/**
	 * Apply the successful update result and schedule an automatic restart when configured.
	 * @param {{name: string}} module Updated module.
	 * @param {{updated: boolean, needRestart: boolean}} result Result to update.
	 * @param {string} stdout Update command output.
	 * @returns {void}
	 */
	handleUpdateSuccess (module, result, stdout) {
		Log.info(`Update logs of ${module.name}: ${stdout}`);
		result.updated = true;
		if (this.autoRestart) {
			Log.info("Update done");
			setTimeout(() => this.nodeRestart(), 3000);
		} else {
			Log.info("Update done, don't forget to restart MagicMirror!");
			result.needRestart = true;
		}
	}

	/**
	 * Restart MagicMirror after a successful automatic update.
	 * Under PM2, exit and let PM2 respawn the process to avoid EADDRINUSE.
	 * @returns {void}
	 */
	nodeRestart () {
		Log.info("Restarting MagicMirror...");

		const isManagedByPm2 = typeof process.env.pm_id !== "undefined";
		if (isManagedByPm2) {
			Log.info("Running under PM2 — exiting for PM2 to respawn.");
			process.exit(0);
			return;
		}

		this.#spawnDetachedSelf();
		process.exit();
	}

	/**
	 * Spawn a detached clone of the current Node process with inherited output.
	 * @returns {void}
	 */
	#spawnDetachedSelf () {
		const [nodeBinary] = process.argv;
		const nodeArgs = process.argv.slice(1);
		const spawnOptions = {
			cwd: this.rootPath,
			detached: true,
			stdio: ["ignore", process.stdout, process.stderr]
		};

		const child = spawn(nodeBinary, nodeArgs, spawnOptions);
		child.unref();
	}

	/**
	 * Check whether the given module is MagicMirror itself.
	 * @param {string} module Module name.
	 * @returns {boolean} Whether the name refers to MagicMirror.
	 */
	static isMagicMirror (module) {
		return module === "MagicMirror";
	}

	/**
	 * Find the configured update command for a module.
	 * @param {{module: string}} module Module configuration.
	 * @returns {string|null} The configured command, if one exists.
	 */
	applyCommand (module) {
		if (Updater.isMagicMirror(module.module) || !this.updates.length) {
			return null;
		}
		let command = null;
		this.updates.forEach((updater) => {
			if (updater[module]) {
				command = updater[module];
			}
		});
		return command;
	}
}

export default Updater;
