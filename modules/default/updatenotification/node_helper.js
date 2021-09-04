const { exec } = require("child_process");
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

	isGitRepo: function (moduleFolder) {
		exec("cd " + moduleFolder + " && git remote -v", (err, stdout, stderr) => {
			if (err) {
				Log.error("Failed to fetch git data for " + moduleFolder + ": " + err);
				return false;
			}
		});

		return true;
	},


	performFetch: function () {
		for (let repo of gitRepos) {
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
			exec("cd " + repo.folder + " && git rev-parse HEAD", (err, stdout, stderr) => {
				if (err) {
					Log.error("Failed to get current commit hash for " + repo.module + ": " + err + " " + stderr);
				} else {
					// console.log(stdout);
					gitInfo.hash = stdout;
					// console.log("hash: " + gitInfo.hash);
					exec("cd " + repo.folder + " && git status -sb", (err, stdout, stderr) => {
						if (err) {
							Log.error("Failed to get git status for " + repo.module + ": " + err + " " + stderr);
						} else {
							let status = stdout.split("\n")[0];
							// console.log(repo.module);
							status = status.match(/(?![.#])([^.]*)/g);
							gitInfo.current = status[0].trim();
							// console.log("current: " + gitInfo.current);
							status = status[1].split(" ");
							gitInfo.tracking = status[0].trim();
							// console.log("tracking: " + gitInfo.tracking);
							if (status[2]) {
								gitInfo.behind = parseInt(status[2].substring(0, status[2].length - 1));
								// console.log("behind: " + gitInfo.behind);
								this.sendSocketNotification("STATUS", gitInfo);
							} else {
								exec("cd " + repo.folder + " && git fetch --dry-run", (err, stdout, stderr) => {
									if (err) {
										Log.error("Failed to fetch git data for " + repo.module + ": " + err);
									} else {
										// console.log(repo.module);
										// console.dir(stderr);
										if (stderr !== "") {
											// get behind
											gitInfo.behind = 1;
											let refs = stderr.split('\n')[1].match(/s*([a-z,0-9]+[\.]+[a-z,0-9]+)s*/g)[0];
											// console.dir(refs);
											if (refs === "") {
												this.sendSocketNotification("STATUS", gitInfo);
											} else {
												exec("cd " + repo.folder + " && git rev-list --ancestry-path --count " + refs, (err, stdout, stderr) => {
													gitInfo.behind = parseInt(stdout);
													// console.log("behind: " + gitInfo.behind);
													this.sendSocketNotification("STATUS", gitInfo);
												});
											}
										}
									}
								});
							}
						}
					});
				}
			});
		// let gitInfo = await this.getGitData(repo);
			// if (gitInfo) {
			// 	console.dir(gitInfo);
			// 	this.sendSocketNotification("STATUS", gitInfo);
			// }
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


// [03.09.2021 23:02.36.382] [LOG]   hash: e19a42879896d2d8e2406fcb3fd4fdcf15d2ed6b
// [03.09.2021 23:02.36.382] [LOG]   trackingorigin/master
// [03.09.2021 23:02.36.714] [LOG]   hash: e40ddd4b69424349768b7e451d9c4f52ac4efe45
// [03.09.2021 23:02.36.714] [LOG]   trackingorigin/develop
