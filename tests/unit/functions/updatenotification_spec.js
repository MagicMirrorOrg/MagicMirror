import { vi, describe, beforeEach, afterEach, it, expect } from "vitest";

/**
 * Creates a fresh GitHelper instance with isolated mocks for each test run.
 * @param {{ current: import("vitest").Mock | null }} fsStatSyncMockRef reference to the mocked fs.statSync.
 * @param {{ current: { error: import("vitest").Mock; info: import("vitest").Mock } | null }} loggerMockRef reference to logger stubs.
 * @param {{ current: import("vitest").MockInstance | null }} execShellSpyRef reference to the execShell spy.
 * @returns {Promise<unknown>} resolved GitHelper instance.
 */
async function createGitHelper (fsStatSyncMockRef, loggerMockRef, execShellSpyRef) {
	vi.resetModules();

	fsStatSyncMockRef.current = vi.fn();
	loggerMockRef.current = { error: vi.fn(), info: vi.fn() };

	vi.doMock("node:fs", () => ({
		statSync: fsStatSyncMockRef.current
	}));

	vi.doMock("logger", () => loggerMockRef.current);

	const defaults = await import("../../../js/defaults");
	const gitHelperModule = await import(`../../../${defaults.defaultModulesDir}/updatenotification/git_helper`);
	const GitHelper = gitHelperModule.default || gitHelperModule;
	const instance = new GitHelper();
	execShellSpyRef.current = vi.spyOn(instance, "execShell");
	instance.__loggerMock = loggerMockRef.current;
	return instance;
}

describe("Updatenotification", () => {
	const fsStatSyncMockRef = { current: null };
	const loggerMockRef = { current: null };
	const execShellSpyRef = { current: null };
	let gitHelper;

	let gitRemoteOut;
	let gitRevParseOut;
	let gitStatusOut;
	let gitFetchOut;
	let gitRevListCountOut;
	let gitRevListOut;
	let gitFetchErr;
	let gitTagListOut;

	const getExecutedCommands = () => execShellSpyRef.current.mock.calls.map(([command]) => command);

	beforeEach(async () => {
		gitHelper = await createGitHelper(fsStatSyncMockRef, loggerMockRef, execShellSpyRef);

		fsStatSyncMockRef.current.mockReturnValue({ isDirectory: () => true });

		gitRemoteOut = "";
		gitRevParseOut = "";
		gitStatusOut = "";
		gitFetchOut = "";
		gitRevListCountOut = "";
		gitRevListOut = "";
		gitFetchErr = "";
		gitTagListOut = "";

		execShellSpyRef.current.mockImplementation((command) => {
			if (command.includes("git remote -v")) {
				return Promise.resolve({ stdout: gitRemoteOut, stderr: "" });
			}

			if (command.includes("git rev-parse HEAD")) {
				return Promise.resolve({ stdout: gitRevParseOut, stderr: "" });
			}

			if (command.includes("git status -sb")) {
				return Promise.resolve({ stdout: gitStatusOut, stderr: "" });
			}

			if (command.includes("git fetch -n --dry-run")) {
				return Promise.resolve({ stdout: gitFetchOut, stderr: gitFetchErr });
			}

			if (command.includes("git rev-list --ancestry-path --count")) {
				return Promise.resolve({ stdout: gitRevListCountOut, stderr: "" });
			}

			if (command.includes("git rev-list --ancestry-path")) {
				return Promise.resolve({ stdout: gitRevListOut, stderr: "" });
			}

			if (command.includes("git ls-remote -q --tags --refs")) {
				return Promise.resolve({ stdout: gitTagListOut, stderr: "" });
			}

			return Promise.resolve({ stdout: "", stderr: "" });
		});

		if (gitHelper.execShell !== execShellSpyRef.current) {
			throw new Error("execShell spy not applied");
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
				  "cd mock-path && git rev-parse HEAD",
				  "cd mock-path && git status -sb",
				  "cd mock-path && git fetch -n --dry-run",
				  "cd mock-path && git rev-list --ancestry-path --count 60e0377..332e429  develop",
				]
			`);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## develop...origin/develop [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
				[
				  "cd mock-path && git rev-parse HEAD",
				  "cd mock-path && git status -sb",
				]
			`);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execShellSpyRef.current.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			expect(gitHelper.gitRepos).toHaveLength(1);
			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);
			expect(execShellSpyRef.current.mock.calls.length).toBeGreaterThan(0);
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
				  "cd mock-path && git rev-parse HEAD",
				  "cd mock-path && git status -sb",
				  "cd mock-path && git fetch -n --dry-run",
				  "cd mock-path && git rev-list --ancestry-path --count 60e0377..332e429  master",
				  "cd mock-path && git ls-remote -q --tags --refs",
				  "cd mock-path && git rev-list --ancestry-path 60e0377..332e429  master",
				]
			`);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## master...origin/master [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
			[
			  "cd mock-path && git rev-parse HEAD",
			  "cd mock-path && git status -sb",
			  "cd mock-path && git fetch -n --dry-run",
			  "cd mock-path && git rev-list --ancestry-path --count 60e0377..332e429  master",
			  "cd mock-path && git ls-remote -q --tags --refs",
			  "cd mock-path && git rev-list --ancestry-path 60e0377..332e429  master",
			]
		`);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execShellSpyRef.current.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

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
			  "cd mock-path && git rev-parse HEAD",
			  "cd mock-path && git status -sb",
			  "cd mock-path && git fetch -n --dry-run",
			  "cd mock-path && git rev-list --ancestry-path --count 60e0377..332e429  master",
			  "cd mock-path && git ls-remote -q --tags --refs",
			  "cd mock-path && git rev-list --ancestry-path 60e0377..332e429  master",
			]
		`);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## master...origin/master [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
			[
			  "cd mock-path && git rev-parse HEAD",
			  "cd mock-path && git status -sb",
			  "cd mock-path && git fetch -n --dry-run",
			  "cd mock-path && git rev-list --ancestry-path --count 60e0377..332e429  master",
			  "cd mock-path && git ls-remote -q --tags --refs",
			  "cd mock-path && git rev-list --ancestry-path 60e0377..332e429  master",
			]
		`);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execShellSpyRef.current.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

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
			  "cd mock-path && git rev-parse HEAD",
			  "cd mock-path && git status -sb",
			  "cd mock-path && git fetch -n --dry-run",
			  "cd mock-path && git rev-list --ancestry-path --count 60e0377..332e429  master",
			  "cd mock-path && git ls-remote -q --tags --refs",
			  "cd mock-path && git rev-list --ancestry-path 60e0377..332e429  master",
			]
		`);
		});

		it("returns status information early if isBehindInStatus", async () => {
			gitStatusOut = "## master...origin/master [behind 5]";

			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
			[
			  "cd mock-path && git rev-parse HEAD",
			  "cd mock-path && git status -sb",
			  "cd mock-path && git fetch -n --dry-run",
			  "cd mock-path && git rev-list --ancestry-path --count 60e0377..332e429  master",
			  "cd mock-path && git ls-remote -q --tags --refs",
			  "cd mock-path && git rev-list --ancestry-path 60e0377..332e429  master",
			]
		`);
		});

		it("excludes repo if status can't be retrieved", async () => {
			const errorMessage = "Failed to retrieve status";
			execShellSpyRef.current.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			const repos = await gitHelper.getRepos();
			expect(repos).toHaveLength(0);
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

			gitHelper.gitRepos = [{ module: moduleName, folder: "mock-path" }];
		});

		it("returns status information without hash", async () => {
			const repos = await gitHelper.getRepos();
			expect(repos[0]).toMatchSnapshot();
			expect(getExecutedCommands()).toMatchInlineSnapshot(`
			[
			  "cd mock-path && git status -sb",
			  "cd mock-path && git fetch -n --dry-run",
			  "cd mock-path && git rev-list --ancestry-path --count 19f7faf..9d83101  master",
			]
		`);
		});
	});
});
