jest.mock("node:util", () => ({
	...jest.requireActual("util"),
	promisify: jest.fn()
}));

jest.mock("node:fs", () => ({
	...jest.requireActual("fs"),
	statSync: jest.fn()
}));

jest.mock("logger", () => ({
	...jest.requireActual("logger"),
	error: jest.fn(),
	info: jest.fn()
}));

describe("Updatenotification", () => {
	const execMock = jest.fn();

	let gitHelper;

	let gitRemoteOut;
	let gitRevParseOut;
	let gitStatusOut;
	let gitFetchOut;
	let gitRevListCountOut;
	let gitRevListOut;
	let gitFetchErr;
	let gitTagListOut;

	beforeAll(async () => {
		const { promisify } = require("node:util");
		promisify.mockReturnValue(execMock);

		const GitHelper = require("../../../modules/default/updatenotification/git_helper");
		gitHelper = new GitHelper();
	});

	beforeEach(() => {
		gitRemoteOut = "";
		gitRevParseOut = "";
		gitStatusOut = "";
		gitFetchOut = "";
		gitRevListCountOut = "";
		gitRevListOut = "";
		gitFetchErr = "";
		gitTagListOut = "";

		execMock.mockImplementation((command) => {
			if (command.includes("git remote -v")) {
				return { stdout: gitRemoteOut };
			} else if (command.includes("git rev-parse HEAD")) {
				return { stdout: gitRevParseOut };
			} else if (command.includes("git status -sb")) {
				return { stdout: gitStatusOut };
			} else if (command.includes("git fetch -n --dry-run")) {
				return { stdout: gitFetchOut, stderr: gitFetchErr };
			} else if (command.includes("git rev-list --ancestry-path --count")) {
				return { stdout: gitRevListCountOut };
			} else if (command.includes("git rev-list --ancestry-path")) {
				return { stdout: gitRevListOut };
			} else if (command.includes("git ls-remote -q --tags --refs")) {
				return { stdout: gitTagListOut };
			}
		});
	});

	afterEach(async () => {
		gitHelper.gitRepos = [];

		jest.clearAllMocks();
	});

	describe("MagicMirror on develop", () => {
		const moduleName = "MagicMirror";

		beforeEach(async () => {
			gitRemoteOut = "origin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (fetch)\norigin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (push)\n";
			gitRevParseOut = "332e429a41f1a2339afd4f0ae96dd125da6beada";
			gitStatusOut = "## develop...origin/develop\n M tests/unit/functions/updatenotification_spec.js\n";
			gitFetchErr = "From github.com:MagicMirrorOrg/MagicMirror\n60e0377..332e429  develop          -> origin/develop\n";
			gitRevListCountOut = "5";

			await gitHelper.add(moduleName);
		});

		it("returns status information", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(5);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## develop...origin/develop [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(3);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execMock.mockRejectedValueOnce(errorMessage);

			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);

			const { error } = require("logger");
			expect(error).toHaveBeenCalledWith(`Failed to retrieve repo info for ${moduleName}: Failed to retrieve status`);
		});
	});

	describe("MagicMirror on master (empty taglist)", () => {
		const moduleName = "MagicMirror";

		beforeEach(async () => {
			gitRemoteOut = "origin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (fetch)\norigin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (push)\n";
			gitRevParseOut = "332e429a41f1a2339afd4f0ae96dd125da6beada";
			gitStatusOut = "## master...origin/master\n M tests/unit/functions/updatenotification_spec.js\n";
			gitFetchErr = "From github.com:MagicMirrorOrg/MagicMirror\n60e0377..332e429  master          -> origin/master\n";
			gitRevListCountOut = "5";

			await gitHelper.add(moduleName);
		});

		it("returns status information", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(7);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## master...origin/master [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(7);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execMock.mockRejectedValueOnce(errorMessage);

			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);

			const { error } = require("logger");
			expect(error).toHaveBeenCalledWith(`Failed to retrieve repo info for ${moduleName}: Failed to retrieve status`);
		});
	});

	describe("MagicMirror on master with match in taglist", () => {
		const moduleName = "MagicMirror";

		beforeEach(async () => {
			gitRemoteOut = "origin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (fetch)\norigin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (push)\n";
			gitRevParseOut = "332e429a41f1a2339afd4f0ae96dd125da6beada";
			gitStatusOut = "## master...origin/master\n M tests/unit/functions/updatenotification_spec.js\n";
			gitFetchErr = "From github.com:MagicMirrorOrg/MagicMirror\n60e0377..332e429  master          -> origin/master\n";
			gitRevListCountOut = "5";
			gitTagListOut = "332e429a41f1a2339afd4f0ae96dd125da6beada...tag...\n";
			gitRevListOut = "332e429a41f1a2339afd4f0ae96dd125da6beada\n";

			await gitHelper.add(moduleName);
		});

		it("returns status information", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(7);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## master...origin/master [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(7);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execMock.mockRejectedValueOnce(errorMessage);

			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);

			const { error } = require("logger");
			expect(error).toHaveBeenCalledWith(`Failed to retrieve repo info for ${moduleName}: Failed to retrieve status`);
		});
	});

	describe("MagicMirror on master without match in taglist", () => {
		const moduleName = "MagicMirror";

		beforeEach(async () => {
			gitRemoteOut = "origin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (fetch)\norigin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (push)\n";
			gitRevParseOut = "332e429a41f1a2339afd4f0ae96dd125da6beada";
			gitStatusOut = "## master...origin/master\n M tests/unit/functions/updatenotification_spec.js\n";
			gitFetchErr = "From github.com:MagicMirrorOrg/MagicMirror\n60e0377..332e429  master          -> origin/master\n";
			gitRevListCountOut = "5";
			gitTagListOut = "xxxe429a41f1a2339afd4f0ae96dd125da6beada...tag...\n";
			gitRevListOut = "332e429a41f1a2339afd4f0ae96dd125da6beada\n";

			await gitHelper.add(moduleName);
		});

		it("returns status information", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(7);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## master...origin/master [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(7);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execMock.mockRejectedValueOnce(errorMessage);

			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);

			const { error } = require("logger");
			expect(error).toHaveBeenCalledWith(`Failed to retrieve repo info for ${moduleName}: Failed to retrieve status`);
		});
	});

	describe("custom module", () => {
		const moduleName = "MMM-Fuel";

		beforeEach(async () => {
			gitRemoteOut = `origin\thttps://github.com/fewieden/${moduleName}.git (fetch)\norigin\thttps://github.com/fewieden/${moduleName}.git (push)\n`;
			gitRevParseOut = "9d8310163da94441073a93cead711ba43e8888d0";
			gitStatusOut = "## master...origin/master";
			gitFetchErr = `From https://github.com/fewieden/${moduleName}\n19f7faf..9d83101  master      -> origin/master`;
			gitRevListCountOut = "7";

			await gitHelper.add(moduleName);
		});

		it("returns status information without hash", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(execMock).toHaveBeenCalledTimes(4);
		});
	});
});
