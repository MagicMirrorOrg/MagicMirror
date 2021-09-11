const path = require("path");
const git_Helper = require("../../../modules/default/updatenotification/git_helper.js");
const gitHelper = new git_Helper.gitHelper();
gitHelper.add("default");

const test1 = {
	module: "test1",
	folder: "",
	res: {
		stdout: "## master...origin/master [behind 8]",
		stderr: ""
	},
	gitInfo: {
		module: "default",
		// commits behind:
		behind: 0,
		// branch name:
		current: "develop",
		// current hash:
		hash: "",
		// remote branch:
		tracking: "",
		isBehindInStatus: false
	}
};

const test2 = {
	module: "test2",
	folder: "",
	res: {
		stdout: "## develop...origin/develop",
		stderr: ""
	}
};

const test3 = {
	module: "test3",
	folder: "",
	res: {
		stdout: "",
		stderr: "error"
	},
	gitInfo: {
		module: "default",
		// commits behind:
		behind: 2,
		// branch name:
		current: "develop",
		// current hash:
		hash: "",
		// remote branch:
		tracking: "",
		isBehindInStatus: true
	}
};

const test4 = {
	module: "default",
	folder: path.join(__dirname, "../../.."),
	res: {
		stdout: "",
		stderr: "   e40ddd4..06389e3  develop    -> origin/develop"
	},
	gitInfo: {
		module: "default",
		// commits behind:
		behind: 0,
		// branch name:
		current: "develop",
		// current hash:
		hash: "",
		// remote branch:
		tracking: "",
		isBehindInStatus: false
	}
};

describe("Updatenotification", function () {
	it("should return valid output for git status", async function () {
		const arr = await gitHelper.getStatus();
		expect(arr.length).toBe(1);
		const gitInfo = arr[0];
		expect(gitInfo.current).not.toBe("");
		expect(gitInfo.hash).not.toBe("");
	}, 15000);

	it("should return behind=8 for test1", async function () {
		const gitInfo = await gitHelper.getStatusInfo(test1);
		expect(gitInfo.behind).toBe(8);
		expect(gitInfo.isBehindInStatus).toBe(true);
	});

	it("should return behind=0 for test2", async function () {
		const gitInfo = await gitHelper.getStatusInfo(test2);
		expect(gitInfo.behind).toBe(0);
		expect(gitInfo.isBehindInStatus).toBe(false);
	});

	it("should return empty status object for test3", async function () {
		const gitInfo = await gitHelper.getStatusInfo(test3);
		expect(gitInfo).toBe(undefined);
	});

	it("should return empty repo object for test2", async function () {
		// no gitInfo provided in res, so returns undefined
		const gitInfo = await gitHelper.getRepoInfo(test2);
		expect(gitInfo).toBe(undefined);
	});

	it("should return empty repo object for test1", async function () {
		// no regex match for refs in empty string, so returns undefined
		const gitInfo = await gitHelper.getRepoInfo(test1);
		expect(gitInfo).toBe(undefined);
	});

	it("should return empty repo object for test4", async function () {
		// git ref list throws error, so returns undefined
		const gitInfo = await gitHelper.getRepoInfo(test4);
		expect(gitInfo).toBe(undefined);
	});

	it("should return behind=2 for test3", async function () {
		const gitInfo = await gitHelper.getRepoInfo(test3);
		expect(gitInfo.behind).toBe(2);
	});
});
