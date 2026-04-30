import { vi, describe, beforeEach, afterEach, it, expect } from "vitest";

/**
 * Creates a fresh GitHelper instance with isolated mocks for each test run.
 * @param {{ current: import("vitest").Mock | null }} fsStatSyncMockRef reference to the mocked fs.statSync.
 * @param {{ current: { error: import("vitest").Mock; info: import("vitest").Mock } | null }} loggerMockRef reference to logger stubs.
 * @param {{ current: import("vitest").MockInstance | null }} execGitSpyRef reference to the execGit spy.
 * @returns {Promise<unknown>} resolved GitHelper instance.
 */
async function createGitHelper (fsStatSyncMockRef, loggerMockRef, execGitSpyRef) {
	vi.resetModules();

	fsStatSyncMockRef.current = vi.fn();
	loggerMockRef.current = { error: vi.fn(), info: vi.fn() };

	vi.doMock("node:fs", () => ({
		statSync: fsStatSyncMockRef.current
	}));

	vi.doMock("logger", () => loggerMockRef.current);

	const defaults = await import("../../../js/defaults");
	const gitHelperModule = await import(`../../../${defaults.defaultModulesDir}/updatenotification/git_helper.js`);
	const GitHelper = gitHelperModule.default || gitHelperModule;
	const instance = new GitHelper();
	execGitSpyRef.current = vi.spyOn(instance, "execGit");
	instance.__loggerMock = loggerMockRef.current;
	return instance;
}

describe("Updatenotification", () => {
	const fsStatSyncMockRef = { current: null };
	const loggerMockRef = { current: null };
	const execGitSpyRef = { current: null };
	let gitHelper;

	let gitRemoteOut;
	let gitRevParseOut;
	let gitStatusOut;
	let gitFetchOut;
	let gitRevListCountOut;
	let gitRevListOut;
	let gitFetchErr;
	let gitTagListOut;

	const getExecutedCommands = () => execGitSpyRef.current.mock.calls.map((call) => call.slice(1).join(" "));

	beforeEach(async () => {
		gitHelper = await createGitHelper(fsStatSyncMockRef, loggerMockRef, execGitSpyRef);

		fsStatSyncMockRef.current.mockReturnValue({ isDirectory: () => true });

		gitRemoteOut = "";
		gitRevParseOut = "";
		gitStatusOut = "";
		gitFetchOut = "";
		gitRevListCountOut = "";
		gitRevListOut = "";
		gitFetchErr = "";
		gitTagListOut = "";

		execGitSpyRef.current.mockImplementation((_folder, ...args) => {
			const command = args.join(" ");

			if (command === "remote -v") {
				return Promise.resolve({ stdout: gitRemoteOut, stderr: "" });
			}

			if (command === "rev-parse HEAD") {
				return Promise.resolve({ stdout: gitRevParseOut, stderr: "" });
			}

			if (command === "status -sb") {
				return Promise.resolve({ stdout: gitStatusOut, stderr: "" });
			}

			if (command === "fetch -n --dry-run") {
				return Promise.resolve({ stdout: gitFetchOut, stderr: gitFetchErr });
			}

			if (command.startsWith("rev-list --ancestry-path --count ")) {
				return Promise.resolve({ stdout: gitRevListCountOut, stderr: "" });
			}

			if (command.startsWith("rev-list --ancestry-path ")) {
				return Promise.resolve({ stdout: gitRevListOut, stderr: "" });
			}

			if (command === "ls-remote -q --tags --refs") {
				return Promise.resolve({ stdout: gitTagListOut, stderr: "" });
			}

			return Promise.resolve({ stdout: "", stderr: "" });
		});

		if (gitHelper.execGit !== execGitSpyRef.current) {
			throw new Error("execGit spy not applied");
		}
	});

	afterEach(() => {
		gitHelper.gitRepos = [];
		vi.resetAllMocks();
	});

	describe("MagicMirror on develop", () => {
		const moduleName = "MagicMirror";

		beforeEach(() => {
			gitRemoteOut = "origin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (fetch)\norigin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (push)\n";
			gitRevParseOut = "332e429a41f1a2339afd4f0ae96dd125da6beada";
			gitStatusOut = "## develop...origin/develop\n M tests/unit/functions/updatenotification_spec.js\n";
			gitFetchErr = "From github.com:MagicMirrorOrg/MagicMirror\n60e0377..332e429  develop          -> origin/develop\n";
			gitRevListCountOut = "5";

			gitHelper.gitRepos = [{ module: moduleName, folder: "mock-path" }];
		});

		it("returns status information", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "rev-parse HEAD",
				  "status -sb",
				  "fetch -n --dry-run",
				  "rev-list --ancestry-path --count 60e0377..332e429  develop",
				]
			`);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## develop...origin/develop [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "rev-parse HEAD",
				  "status -sb",
				]
			`);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execGitSpyRef.current.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			expect(gitHelper.gitRepos).toHaveLength(1);
			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);
			expect(execGitSpyRef.current.mock.calls.length).toBeGreaterThan(0);
		});
	});

	describe("MagicMirror on master (empty taglist)", () => {
		const moduleName = "MagicMirror";

		beforeEach(() => {
			gitRemoteOut = "origin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (fetch)\norigin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (push)\n";
			gitRevParseOut = "332e429a41f1a2339afd4f0ae96dd125da6beada";
			gitStatusOut = "## master...origin/master\n M tests/unit/functions/updatenotification_spec.js\n";
			gitFetchErr = "From github.com:MagicMirrorOrg/MagicMirror\n60e0377..332e429  master          -> origin/master\n";
			gitRevListCountOut = "5";

			gitHelper.gitRepos = [{ module: moduleName, folder: "mock-path" }];
		});

		it("returns status information", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "rev-parse HEAD",
				  "status -sb",
				  "fetch -n --dry-run",
				  "rev-list --ancestry-path --count 60e0377..332e429  master",
				  "ls-remote -q --tags --refs",
				  "rev-list --ancestry-path 60e0377..332e429  master",
				]
			`);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## master...origin/master [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "rev-parse HEAD",
				  "status -sb",
				  "fetch -n --dry-run",
				  "rev-list --ancestry-path --count 60e0377..332e429  master",
				  "ls-remote -q --tags --refs",
				  "rev-list --ancestry-path 60e0377..332e429  master",
				]
			`);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execGitSpyRef.current.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);
		});
	});

	describe("MagicMirror on master with match in taglist", () => {
		const moduleName = "MagicMirror";

		beforeEach(() => {
			gitRemoteOut = "origin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (fetch)\norigin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (push)\n";
			gitRevParseOut = "332e429a41f1a2339afd4f0ae96dd125da6beada";
			gitStatusOut = "## master...origin/master\n M tests/unit/functions/updatenotification_spec.js\n";
			gitFetchErr = "From github.com:MagicMirrorOrg/MagicMirror\n60e0377..332e429  master          -> origin/master\n";
			gitRevListCountOut = "5";
			gitTagListOut = "332e429a41f1a2339afd4f0ae96dd125da6beada\ttag\n";
			gitRevListOut = "332e429a41f1a2339afd4f0ae96dd125da6beada\n";

			gitHelper.gitRepos = [{ module: moduleName, folder: "mock-path" }];
		});

		it("returns status information", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "rev-parse HEAD",
				  "status -sb",
				  "fetch -n --dry-run",
				  "rev-list --ancestry-path --count 60e0377..332e429  master",
				  "ls-remote -q --tags --refs",
				  "rev-list --ancestry-path 60e0377..332e429  master",
				]
			`);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## master...origin/master [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "rev-parse HEAD",
				  "status -sb",
				  "fetch -n --dry-run",
				  "rev-list --ancestry-path --count 60e0377..332e429  master",
				  "ls-remote -q --tags --refs",
				  "rev-list --ancestry-path 60e0377..332e429  master",
				]
			`);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execGitSpyRef.current.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);
		});
	});

	describe("MagicMirror on master without match in taglist", () => {
		const moduleName = "MagicMirror";

		beforeEach(() => {
			gitRemoteOut = "origin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (fetch)\norigin\tgit@github.com:MagicMirrorOrg/MagicMirror.git (push)\n";
			gitRevParseOut = "332e429a41f1a2339afd4f0ae96dd125da6beada";
			gitStatusOut = "## master...origin/master\n M tests/unit/functions/updatenotification_spec.js\n";
			gitFetchErr = "From github.com:MagicMirrorOrg/MagicMirror\n60e0377..332e429  master          -> origin/master\n";
			gitRevListCountOut = "5";
			gitTagListOut = "xxxe429a41f1a2339afd4f0ae96dd125da6beada\ttag\n";
			gitRevListOut = "332e429a41f1a2339afd4f0ae96dd125da6beada\n";

			gitHelper.gitRepos = [{ module: moduleName, folder: "mock-path" }];
		});

		it("returns status information", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "rev-parse HEAD",
				  "status -sb",
				  "fetch -n --dry-run",
				  "rev-list --ancestry-path --count 60e0377..332e429  master",
				  "ls-remote -q --tags --refs",
				  "rev-list --ancestry-path 60e0377..332e429  master",
				]
			`);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## master...origin/master [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "rev-parse HEAD",
				  "status -sb",
				  "fetch -n --dry-run",
				  "rev-list --ancestry-path --count 60e0377..332e429  master",
				  "ls-remote -q --tags --refs",
				  "rev-list --ancestry-path 60e0377..332e429  master",
				]
			`);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execGitSpyRef.current.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);
		});
	});

	describe("custom module", () => {
		const moduleName = "MMM-Fuel";

		beforeEach(() => {
			gitRemoteOut = `origin\thttps://github.com/fewieden/${moduleName}.git (fetch)\norigin\thttps://github.com/fewieden/${moduleName}.git (push)\n`;
			gitRevParseOut = "9d8310163da94441073a93cead711ba43e8888d0";
			gitStatusOut = "## master...origin/master";
			gitFetchErr = `From https://github.com/fewieden/${moduleName}\n19f7faf..9d83101  master      -> origin/master`;
			gitRevListCountOut = "7";

			gitHelper.gitRepos = [{ module: moduleName, folder: "mock-path" }];
		});

		it("returns status information without hash", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "status -sb",
				  "fetch -n --dry-run",
				  "rev-list --ancestry-path --count 19f7faf..9d83101  master",
				]
			`);
		});
	});
});
