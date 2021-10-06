jest.mock("util", () => ({
	...jest.requireActual("util"),
	promisify: jest.fn()
}));

jest.mock("fs", () => ({
	...jest.requireActual("fs"),
	statSync: jest.fn()
}));

jest.mock("logger", () => ({
	...jest.requireActual("logger"),
	error: jest.fn(),
	info: jest.fn()
}));

describe("Updatenotification", function () {
	const execMock = jest.fn();

	let gitHelper;

	let gitRemoteOut;
	let gitRevParseOut;
	let gitStatusOut;
	let gitFetchOut;
	let gitRevListOut;
	let gitRemoteErr;
	let gitRevParseErr;
	let gitStatusErr;
	let gitFetchErr;
	let gitRevListErr;

	beforeAll(async function () {
		const { promisify } = require("util");
		promisify.mockReturnValue(execMock);

		const GitHelper = require(`../../../modules/default/updatenotification/git_helper`);
		gitHelper = new GitHelper();
	});

	beforeEach(function () {
		gitRemoteOut = "";
		gitRevParseOut = "";
		gitStatusOut = "";
		gitFetchOut = "";
		gitRevListOut = "";
		gitRemoteErr = "";
		gitRevParseErr = "";
		gitStatusErr = "";
		gitFetchErr = "";
		gitRevListErr = "";

		execMock.mockImplementation(function (command) {
			if (command.includes("git remote -v")) {
				return { stdout: gitRemoteOut, stderr: gitRemoteErr };
			} else if (command.includes("git rev-parse HEAD")) {
				return { stdout: gitRevParseOut, stderr: gitRevParseErr };
			} else if (command.includes("git status -sb")) {
				return { stdout: gitStatusOut, stderr: gitStatusErr };
			} else if (command.includes("git fetch --dry-run")) {
				return { stdout: gitFetchOut, stderr: gitFetchErr };
			} else if (command.includes("git rev-list --ancestry-path --count")) {
				return { stdout: gitRevListOut, stderr: gitRevListErr };
			}
		});
	});

	afterEach(async function () {
		gitHelper.gitRepos = [];

		jest.clearAllMocks();
	});

	describe("default", () => {
		const moduleName = "default";

		beforeEach(async function () {
			gitRemoteOut = "origin\tgit@github.com:MichMich/MagicMirror.git (fetch)\norigin\tgit@github.com:MichMich/MagicMirror.git (push)\n";
			gitRevParseOut = "332e429a41f1a2339afd4f0ae96dd125da6beada";
			gitStatusOut = "## develop...origin/develop\n M tests/unit/functions/updatenotification_spec.js\n";
			gitFetchErr = "From github.com:MichMich/MagicMirror\n60e0377..332e429  develop          -> origin/develop\n";
			gitRevListOut = "5";

			await gitHelper.add(moduleName);
		});

		it("returns status information", async function () {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(5);
		});

		it("returns status information early if isBehindInStatus", async function () {
			gitStatusOut = "## develop...origin/develop [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(3);
		});

		it("excludes repo if status can't be retrieved", async function () {
			const errorMessage = "Failed to retrieve status";
			execMock.mockRejectedValueOnce(errorMessage);

			const repos = await gitHelper.getRepos();
			expect(repos.length).toBe(0);

			const { error } = require("logger");
			expect(error).toHaveBeenCalledWith(`Failed to retrieve repo info for ${moduleName}: Failed to retrieve status`);
		});

		it("excludes repo if refs don't match regex", async function () {
			gitFetchErr = "";

			const repos = await gitHelper.getRepos();
			expect(repos.length).toBe(0);
		});
	});

	describe("custom module", () => {
		const moduleName = "MMM-Fuel";

		beforeEach(async function () {
			gitRemoteOut = `origin\thttps://github.com/fewieden/${moduleName}.git (fetch)\norigin\thttps://github.com/fewieden/${moduleName}.git (push)\n`;
			gitRevParseOut = "9d8310163da94441073a93cead711ba43e8888d0";
			gitStatusOut = "## master...origin/master";
			gitFetchErr = `From https://github.com/fewieden/${moduleName}\n19f7faf..9d83101  master      -> origin/master`;
			gitRevListOut = "7";

			await gitHelper.add(moduleName);
		});

		it("returns status information without hash", async function () {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(4);
		});
	});
});
