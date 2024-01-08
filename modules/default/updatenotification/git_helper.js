const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);
const fs = require("node:fs");
const path = require("node:path");
const Log = require("logger");

const BASE_DIR = path.normalize(`${__dirname}/../../../`);

class GitHelper {
	constructor () {
		this.gitRepos = [];
		this.gitResultList = [];
	}

	getRefRegex (branch) {
		return new RegExp(`s*([a-z,0-9]+[.][.][a-z,0-9]+)  ${branch}`, "g");
	}

	async execShell (command) {
		const { stdout = "", stderr = "" } = await exec(command);

		return { stdout, stderr };
	}

	async isGitRepo (moduleFolder) {
		const { stderr } = await this.execShell(`cd ${moduleFolder} && git remote -v`);

		if (stderr) {
			Log.error(`Failed to fetch git data for ${moduleFolder}: ${stderr}`);

			return false;
		}

		return true;
	}

	async add (moduleName) {
		let moduleFolder = BASE_DIR;

		if (moduleName !== "MagicMirror") {
			moduleFolder = `${moduleFolder}modules/${moduleName}`;
		}

		try {
			Log.info(`Checking git for module: ${moduleName}`);
			// Throws error if file doesn't exist
			fs.statSync(path.join(moduleFolder, ".git"));

			// Fetch the git or throw error if no remotes
			const isGitRepo = await this.isGitRepo(moduleFolder);

			if (isGitRepo) {
				// Folder has .git and has at least one git remote, watch this folder
				this.gitRepos.push({ module: moduleName, folder: moduleFolder });
			}
		} catch (err) {
			// Error when directory .git doesn't exist or doesn't have any remotes
			// This module is not managed with git, skip
		}
	}

	async getStatusInfo (repo) {
		let gitInfo = {
			module: repo.module,
			behind: 0, // commits behind
			current: "", // branch name
			hash: "", // current hash
			tracking: "", // remote branch
			isBehindInStatus: false
		};

		if (repo.module === "MagicMirror") {
			// the hash is only needed for the mm repo
			const { stderr, stdout } = await this.execShell(`cd ${repo.folder} && git rev-parse HEAD`);

			if (stderr) {
				Log.error(`Failed to get current commit hash for ${repo.module}: ${stderr}`);
			}

			gitInfo.hash = stdout;
		}

		const { stderr, stdout } = await this.execShell(`cd ${repo.folder} && git status -sb`);

		if (stderr) {
			Log.error(`Failed to get git status for ${repo.module}: ${stderr}`);
			// exit without git status info
			return;
		}

		// only the first line of stdout is evaluated
		let status = stdout.split("\n")[0];
		// examples for status:
		// ## develop...origin/develop
		// ## master...origin/master [behind 8]
		// ## master...origin/master [ahead 8, behind 1]
		// ## HEAD (no branch)
		status = status.match(/## (.*)\.\.\.([^ ]*)(?: .*behind (\d+))?/);
		// examples for status:
		// [ '## develop...origin/develop', 'develop', 'origin/develop' ]
		// [ '## master...origin/master [behind 8]', 'master', 'origin/master', '8' ]
		// [ '## master...origin/master [ahead 8, behind 1]', 'master', 'origin/master', '1' ]
		if (status) {
			gitInfo.current = status[1];
			gitInfo.tracking = status[2];

			if (status[3]) {
				// git fetch was already called before so `git status -sb` delivers already the behind number
				gitInfo.behind = parseInt(status[3]);
				gitInfo.isBehindInStatus = true;
			}
		}

		return gitInfo;
	}

	async getRepoInfo (repo) {
		const gitInfo = await this.getStatusInfo(repo);

		if (!gitInfo || !gitInfo.current) {
			return;
		}

		if (gitInfo.isBehindInStatus && (gitInfo.module !== "MagicMirror" || gitInfo.current !== "master")) {
			return gitInfo;
		}

		const { stderr } = await this.execShell(`cd ${repo.folder} && git fetch -n --dry-run`);

		// example output:
		// From https://github.com/MagicMirrorOrg/MagicMirror
		//    e40ddd4..06389e3  develop    -> origin/develop
		// here the result is in stderr (this is a git default, don't ask why ...)
		const matches = stderr.match(this.getRefRegex(gitInfo.current));

		// this is the default if there was no match from "git fetch -n --dry-run".
		// Its a fallback because if there was a real "git fetch", the above "git fetch -n --dry-run" would deliver nothing.
		let refDiff = `${gitInfo.current}..origin/${gitInfo.current}`;
		if (matches && matches[0]) {
			refDiff = matches[0];
		}

		// get behind with refs
		try {
			const { stdout } = await this.execShell(`cd ${repo.folder} && git rev-list --ancestry-path --count ${refDiff}`);
			gitInfo.behind = parseInt(stdout);

			// for MagicMirror-Repo and "master" branch avoid getting notified when no tag is in refDiff
			// so only releases are reported and we can change e.g. the README.md without sending notifications
			if (gitInfo.behind > 0 && gitInfo.module === "MagicMirror" && gitInfo.current === "master") {
				let tagList = "";
				try {
					const { stdout } = await this.execShell(`cd ${repo.folder} && git ls-remote -q --tags --refs`);
					tagList = stdout.trim();
				} catch (err) {
					Log.error(`Failed to get tag list for ${repo.module}: ${err}`);
				}
				// check if tag is between commits and only report behind > 0 if so
				try {
					const { stdout } = await this.execShell(`cd ${repo.folder} && git rev-list --ancestry-path ${refDiff}`);
					let cnt = 0;
					for (const ref of stdout.trim().split("\n")) {
						if (tagList.includes(ref)) cnt++; // tag found
					}
					if (cnt === 0) gitInfo.behind = 0;
				} catch (err) {
					Log.error(`Failed to get git revisions for ${repo.module}: ${err}`);
				}
			}

			return gitInfo;
		} catch (err) {
			Log.error(`Failed to get git revisions for ${repo.module}: ${err}`);
		}
	}

	async getRepos () {
		this.gitResultList = [];

		for (const repo of this.gitRepos) {
			try {
				const gitInfo = await this.getRepoInfo(repo);

				if (gitInfo) {
					this.gitResultList.push(gitInfo);
				}
			} catch (e) {
				Log.error(`Failed to retrieve repo info for ${repo.module}: ${e}`);
			}
		}

		return this.gitResultList;
	}

	async checkUpdates () {
		var updates = [];

		const allRepos = await this.gitResultList.map((module) => {
			return new Promise((resolve) => {
				if (module.behind > 0 && module.module !== "MagicMirror") {
					Log.info(`Update found for module: ${module.module}`);
					updates.push(module);
				}
				resolve(module);
			});
		});
		await Promise.all(allRepos);

		return updates;
	}
}

module.exports = GitHelper;
