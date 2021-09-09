const GitHelper = require(__dirname + "/git_helper.js");
const defaultModules = require(__dirname + "/../defaultmodules.js");
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	config: {},

	updateTimer: null,
	updateProcessStarted: false,

	gitHelper: new GitHelper.gitHelper(),

	start: function () {},

	configureModules: async function (modules) {
		// Push MagicMirror itself , biggest chance it'll show up last in UI and isn't overwritten
		// others will be added in front
		// this method returns promises so we can't wait for every one to resolve before continuing
		this.gitHelper.add("default");

		for (let moduleName in modules) {
			if (!this.ignoreUpdateChecking(moduleName)) {
				this.gitHelper.add(moduleName);
			}
		}
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "CONFIG") {
			this.config = payload;
		} else if (notification === "MODULES") {
			// if this is the 1st time thru the update check process
			if (!this.updateProcessStarted) {
				this.updateProcessStarted = true;
				this.configureModules(payload).then(() => this.performFetch());
			}
		}
	},

	performFetch: async function () {
		for (let gitInfo of await this.gitHelper.getRepos()) {
			this.sendSocketNotification("STATUS", gitInfo);
		}

		this.scheduleNextFetch(this.config.updateInterval);
	},

	scheduleNextFetch: function (delay) {
		if (delay < 60 * 1000) {
			delay = 60 * 1000;
		}

		let self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function () {
			self.performFetch();
		}, delay);
	},

	ignoreUpdateChecking: function (moduleName) {
		// Should not check for updates for default modules
		if (defaultModules.indexOf(moduleName) >= 0) {
			return true;
		}

		// Should not check for updates for ignored modules
		if (this.config.ignoreModules.indexOf(moduleName) >= 0) {
			return true;
		}

		// The rest of the modules that passes should check for updates
		return false;
	}
});
