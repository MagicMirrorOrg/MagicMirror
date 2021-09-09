const path = require("path");
const git_Helper = require("../../../modules/default/updatenotification/git_helper.js");
const gitHelper = new git_Helper.gitHelper();
gitHelper.add("default");

describe("Updatenotification", function () {
	it("should return valid output for git status", async function () {
		const arr = await gitHelper.getStatus();
		expect(arr.length).toBe(1);
		const gitInfo = arr[0];
		expect(gitInfo.current).not.toBe("");
		expect(gitInfo.hash).not.toBe("");
	}, 15000);
});
