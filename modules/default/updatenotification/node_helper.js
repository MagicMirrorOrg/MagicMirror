const SimpleGit = require("simple-git");
const simpleGits = [];
const fs = require("fs");
const path = require("path");
const defaultModules = require(__dirname + "/../defaultmodules.js");
const Log = require("logger");
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	config: {},

	updateTimer: null,
	updateProcessStarted: false,

	start: function () {},

	configureModules: async function (modules) {
		// Push MagicMirror itself , biggest chance it'll show up last in UI and isn't overwritten
		// others will be added in front
		// this method returns promises so we can't wait for every one to resolve before continuing
		simpleGits.push({ module: "default", git: this.createGit(path.normalize(__dirname + "/../../../")) });

		for (let moduleName in modules) {
			if (!this.ignoreUpdateChecking(moduleName)) {
				// Default modules are included in the main MagicMirror repo
				let moduleFolder = path.normalize(__dirname + "/../../" + moduleName);

				try {
					Log.info("Checking git for module: " + moduleName);
					// Throws error if file doesn't exist
					fs.statSync(path.join(moduleFolder, ".git"));
					// Fetch the git or throw error if no remotes
					let git = await this.resolveRemote(moduleFolder);
					// Folder has .git and has at least one git remote, watch this folder
					simpleGits.unshift({ module: moduleName, git: git });
				} catch (err) {
					// Error when directory .git doesn't exist or doesn't have any remotes
					// This module is not managed with git, skip
					continue;
				}
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

	resolveRemote: async function (moduleFolder) {
		let git = this.createGit(moduleFolder);
		let remotes = await git.getRemotes(true);

		if (remotes.length < 1 || remotes[0].name.length < 1) {
			throw new Error("No valid remote for folder " + moduleFolder);
		}

		return git;
	},

	performFetch: async function () {
		for (let sg of simpleGits) {
			try {
				let fetchData = await sg.git.fetch(["--dry-run"]).status();
				let logData = await sg.git.log({ "-1": null });

				if (logData.latest && "hash" in logData.latest) {
					this.sendSocketNotification("STATUS", {
						module: sg.module,
						behind: fetchData.behind,
						current: fetchData.current,
						hash: logData.latest.hash,
						tracking: fetchData.tracking
					});
				}
			} catch (err) {
				Log.error("Failed to fetch git data for " + sg.module + ": " + err);
			}
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

	createGit: function (folder) {
		return SimpleGit({ baseDir: folder, timeout: { block: this.config.timeout } });
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
