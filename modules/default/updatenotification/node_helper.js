const util = require("util");
const exec = util.promisify(require("child_process").exec);
const gitRepos = [];
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
		gitRepos.push({ module: "default", folder: path.normalize(__dirname + "/../../../") });

		for (let moduleName in modules) {
			if (!this.ignoreUpdateChecking(moduleName)) {
				// Default modules are included in the main MagicMirror repo
				let moduleFolder = path.normalize(__dirname + "/../../" + moduleName);

				try {
					Log.info("Checking git for module: " + moduleName);
					// Throws error if file doesn't exist
					fs.statSync(path.join(moduleFolder, ".git"));
					// Fetch the git or throw error if no remotes
					if (this.isGitRepo(moduleFolder)) {
						// Folder has .git and has at least one git remote, watch this folder
						gitRepos.unshift({ module: moduleName, folder: moduleFolder });
					}
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

	execShell: async function (command) {
		let res = { stdout: "", stderr: "" };
		const { stdout, stderr } = await exec(command);

		res.stdout = stdout;
		res.stderr = stderr;
		return res;
	},

	isGitRepo: async function (moduleFolder) {
		let res = await this.execShell("cd " + moduleFolder + " && git remote -v");
		if (res.stderr) {
			Log.error("Failed to fetch git data for " + moduleFolder + ": " + res.stderr);
			return false;
		} else {
			return true;
		}
	},

	getRepoInfo: async function (repo) {
		let gitInfo = {
			module: repo.module,
			// commits behind:
			behind: 0,
			// branch name:
			current: "",
			// current hash:
			hash: "",
			// remote branch:
			tracking: ""
		};
		let res = await this.execShell("cd " + repo.folder + " && git rev-parse HEAD");
		if (res.stderr) {
			Log.error("Failed to get current commit hash for " + repo.module + ": " + res.stderr);
		}
		gitInfo.hash = res.stdout;
		res = await this.execShell("cd " + repo.folder + " && git status -sb");
		if (res.stderr) {
			Log.error("Failed to get git status for " + repo.module + ": " + res.stderr);
			// exit without git status info
			return;
		}
		// get branch and remote
		let status = res.stdout.split("\n")[0];
		status = status.match(/(?![.#])([^.]*)/g);
		gitInfo.current = status[0].trim();
		status = status[1].split(" ");
		gitInfo.tracking = status[0].trim();
		if (status[2]) {
			// git fetch was already called before so `git status -sb` delivers already the behind number
			gitInfo.behind = parseInt(status[2].substring(0, status[2].length - 1));
			return gitInfo;
		}
		res = await this.execShell("cd " + repo.folder + " && git fetch --dry-run");
		// here the result is in stderr
		if (res.stderr === "") return;
		// set default > 0
		gitInfo.behind = 1;
		let refs = res.stderr.match(/s*([a-z,0-9]+[.][.][a-z,0-9]+)s*/g)[0];
		if (refs === "") {
			return gitInfo;
		}
		res = await this.execShell("cd " + repo.folder + " && git rev-list --ancestry-path --count " + refs);
		gitInfo.behind = parseInt(res.stdout);
		return gitInfo;
	},

	performFetch: async function () {
		for (let repo of gitRepos) {
			const gitInfo = await this.getRepoInfo(repo);
			if (gitInfo) {
				this.sendSocketNotification("STATUS", gitInfo);
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
