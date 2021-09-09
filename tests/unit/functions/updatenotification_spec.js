const path = require("path");
const git_Helper = require("../../../modules/default/updatenotification/git_helper.js");
const gitHelper = new git_Helper.gitHelper();
gitHelper.add("default");
let branch = "";

describe("Updatenotification", function () {
	// it is assumed that we are at the HEAD of a branch when running this tests
	// and we have no foreign modules installed.

	it("should return 0 for repo count", async function () {
		const arr = await gitHelper.getRepos();
		expect(arr.length).toBe(0);
	}, 15000);

	it("should return valid output for git status", async function () {
		const arr = await gitHelper.getStatus();
		expect(arr.length).toBe(1);
		const gitInfo = arr[0];
		branch = gitInfo.current;
		expect(gitInfo.current).not.toBe("");
	}, 15000);

	it("should return no refs for git fetch", async function () {
		const baseDir = path.normalize(__dirname + "/../../../");
		const res = await gitHelper.execShell("cd " + baseDir + " && git fetch --dry-run");
		expect(res.stderr.match(gitHelper.getRefRegex(branch))).toBe(null);
	});
});
