const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");
const path = require("path");
const Log = require("logger");

const BASE_DIR = path.normalize(`${__dirname}/../../../`);

class GitHelper {
	constructor() {
		this.gitRepos = [];
	}

	getRefRegex(branch) {
		return new RegExp(`s*([a-z,0-9]+[.][.][a-z,0-9]+)  ${branch}`, "g");
	}

	async execShell(command) {
		const { stdout = "", stderr = "" } = await exec(command);

		return { stdout, stderr };
	}

	async isGitRepo(moduleFolder) {
		const { stderr } = await this.execShell(`cd ${moduleFolder} && git remote -v`);

		if (stderr) {
			Log.error(`Failed to fetch git data for ${moduleFolder}: ${stderr}`);

			return false;
		}

		return true;
	}

	async add(moduleName) {
		let moduleFolder = BASE_DIR;

		if (moduleName !== "default") {
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

	async getStatusInfo(repo) {
		let gitInfo = {
			module: repo.module,
			behind: 0, // commits behind
			current: "", // branch name
			hash: "", // current hash
			tracking: "", // remote branch
			isBehindInStatus: false
		};

		if (repo.module === "default") {
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
		status = status.match(/(?![.#])([^.]*)/g);
		// examples for status:
		// [ ' develop', 'origin/develop', '' ]
		// [ ' master', 'origin/master [behind 8]', '' ]
		gitInfo.current = status[0].trim();
		status = status[1].split(" ");
		// examples for status:
		// [ 'origin/develop' ]
		// [ 'origin/master', '[behind', '8]' ]
		gitInfo.tracking = status[0].trim();

		if (status[2]) {
			// git fetch was already called before so `git status -sb` delivers already the behind number
			gitInfo.behind = parseInt(status[2].substring(0, status[2].length - 1));
			gitInfo.isBehindInStatus = true;
		}

		return gitInfo;
	}

	async getRepoInfo(repo) {
		const gitInfo = await this.getStatusInfo(repo);

		if (!gitInfo) {
			return;
		}

		if (gitInfo.isBehindInStatus) {
			return gitInfo;
		}

		const { stderr } = await this.execShell(`cd ${repo.folder} && git fetch --dry-run`);

		// example output:
		// From https://github.com/MichMich/MagicMirror
		//    e40ddd4..06389e3  develop    -> origin/develop
		// here the result is in stderr (this is a git default, don't ask why ...)
		const matches = stderr.match(this.getRefRegex(gitInfo.current));

		if (!matches || !matches[0]) {
			// no refs found, nothing to do
			return;
		}

		// get behind with refs
		try {
			const { stdout } = await this.execShell(`cd ${repo.folder} && git rev-list --ancestry-path --count ${matches[0]}`);
			gitInfo.behind = parseInt(stdout);

			return gitInfo;
		} catch (err) {
			Log.error(`Failed to get git revisions for ${repo.module}: ${err}`);
		}
	}

	async getRepos() {
		const gitResultList = [];

		for (const repo of this.gitRepos) {
			try {
				const gitInfo = await this.getRepoInfo(repo);

				if (gitInfo) {
					gitResultList.push(gitInfo);
				}
			} catch (e) {
				Log.error(`Failed to retrieve repo info for ${repo.module}: ${e}`);
			}
		}

		return gitResultList;
	}
}

module.exports = GitHelper;
