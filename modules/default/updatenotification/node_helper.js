const fs = require("node:fs");
const path = require("node:path");
const NodeHelper = require("node_helper");

const defaultModules = require(`${global.root_path}/modules/default/defaultmodules`);
const GitHelper = require("./git_helper");
const UpdateHelper = require("./update_helper");

const ONE_MINUTE = 60 * 1000;

module.exports = NodeHelper.create({
	config: {},

	updateTimer: null,
	updateProcessStarted: false,

	gitHelper: new GitHelper(),
	updateHelper: null,

	getModules (modules) {
		if (this.config.useModulesFromConfig) {
			return modules;
		} else {
			// get modules from modules-directory
			const moduleDir = path.normalize(`${global.root_path}/modules`);
			const getDirectories = (source) => {
				return fs.readdirSync(source, { withFileTypes: true })
					.filter((dirent) => dirent.isDirectory() && dirent.name !== "default")
					.map((dirent) => dirent.name);
			};
			return getDirectories(moduleDir);
		}
	},

	async configureModules (modules) {
		for (const moduleName of this.getModules(modules)) {
			if (!this.ignoreUpdateChecking(moduleName)) {
				await this.gitHelper.add(moduleName);
			}
		}

		if (!this.ignoreUpdateChecking("MagicMirror")) {
			await this.gitHelper.add("MagicMirror");
		}
	},

	async socketNotificationReceived (notification, payload) {
		switch (notification) {
			case "CONFIG":
				this.config = payload;
				this.updateHelper = new UpdateHelper(this.config);
				await this.updateHelper.check_PM2_Process();
				break;
			case "MODULES":
				// if this is the 1st time thru the update check process
				if (!this.updateProcessStarted) {
					this.updateProcessStarted = true;
					await this.configureModules(payload);
					await this.performFetch();
				}
				break;
			case "SCAN_UPDATES":
				// 1st time of check allows to force new scan
				if (this.updateProcessStarted) {
					clearTimeout(this.updateTimer);
					await this.performFetch();
				}
				break;
		}
	},

	async performFetch () {
		const repos = await this.gitHelper.getRepos();

		for (const repo of repos) {
			this.sendSocketNotification("REPO_STATUS", repo);
		}

		const updates = await this.gitHelper.checkUpdates();

		if (this.config.sendUpdatesNotifications && updates.length) {
			this.sendSocketNotification("UPDATES", updates);
		}

		if (updates.length) {
			const updateResult = await this.updateHelper.parse(updates);
			for (const update of updateResult) {
				if (update.inProgress) {
					this.sendSocketNotification("UPDATE_STATUS", update);
				}
			}
		}

		this.scheduleNextFetch(this.config.updateInterval);
	},

	scheduleNextFetch (delay) {
		clearTimeout(this.updateTimer);

		this.updateTimer = setTimeout(
			() => {
				this.performFetch();
			},
			Math.max(delay, ONE_MINUTE)
		);
	},

	ignoreUpdateChecking (moduleName) {
		// Should not check for updates for default modules
		if (defaultModules.includes(moduleName)) {
			return true;
		}

		// Should not check for updates for ignored modules
		if (this.config.ignoreModules.includes(moduleName)) {
			return true;
		}

		// The rest of the modules that passes should check for updates
		return false;
	}
});
