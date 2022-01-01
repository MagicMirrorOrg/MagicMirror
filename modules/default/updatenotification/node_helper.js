const GitHelper = require("./git_helper");
const defaultModules = require("../defaultmodules");
const NodeHelper = require("node_helper");

const ONE_MINUTE = 60 * 1000;

module.exports = NodeHelper.create({
	config: {},

	updateTimer: null,
	updateProcessStarted: false,

	gitHelper: new GitHelper(),

	async configureModules(modules) {
		for (const moduleName of modules) {
			if (!this.ignoreUpdateChecking(moduleName)) {
				await this.gitHelper.add(moduleName);
			}
		}

		await this.gitHelper.add("default");
	},

	async socketNotificationReceived(notification, payload) {
		if (notification === "CONFIG") {
			this.config = payload;
		} else if (notification === "MODULES") {
			// if this is the 1st time thru the update check process
			if (!this.updateProcessStarted) {
				this.updateProcessStarted = true;
				await this.configureModules(payload);
				await this.performFetch();
			}
		}
	},

	async performFetch() {
		const repos = await this.gitHelper.getRepos();

		for (const repo of repos) {
			this.sendSocketNotification("STATUS", repo);
		}

		this.scheduleNextFetch(this.config.updateInterval);
	},

	scheduleNextFetch(delay) {
		clearTimeout(this.updateTimer);

		this.updateTimer = setTimeout(() => {
			this.performFetch();
		}, Math.max(delay, ONE_MINUTE));
	},

	ignoreUpdateChecking(moduleName) {
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
