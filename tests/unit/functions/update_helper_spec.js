import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", async (importOriginal) => {
	const actual = await importOriginal();
	return { ...actual, spawn: vi.fn(() => ({ unref: vi.fn() })) };
});

const spawnMock = vi.mocked(spawn);

describe("UpdateHelper", () => {
	const originalEnv = { ...process.env };
	const tempRoots = [];

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
		global.version = "test";
		global.root_path = process.cwd();
		spawnMock.mockClear();
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.useRealTimers();
		vi.restoreAllMocks();
		for (const tempRoot of tempRoots) {
			rmSync(tempRoot, { recursive: true, force: true });
		}
		tempRoots.length = 0;
	});

	/**
	 * Creates a temporary MagicMirror-like root with a module directory.
	 * @param {string} moduleName - Name of the module directory to create.
	 * @returns {{ root: string, modulePath: string }} Created paths.
	 */
	const createTempModuleRoot = (moduleName) => {
		const root = mkdtempSync(join(tmpdir(), "mm-updater-"));
		const modulePath = join(root, "modules", moduleName);
		mkdirSync(modulePath, { recursive: true });
		tempRoots.push(root);
		return { root, modulePath };
	};

	/**
	 * Creates a fresh UpdateHelper instance for testing.
	 * @param {object} config - Optional config overrides.
	 * @returns {Promise<object>} Resolved UpdateHelper instance.
	 */
	const createUpdater = async (config = {}) => {
		const updateHelperModule = await import("../../../defaultmodules/updatenotification/update_helper.js");
		const UpdateHelper = updateHelperModule.default || updateHelperModule;
		return new UpdateHelper({ updates: [], updateTimeout: 1000, updateAutorestart: false, ...config });
	};

	it("marks update as requiring manual restart when autoRestart is disabled", async () => {
		const moduleName = "MMM-Test";
		const { root } = createTempModuleRoot(moduleName);
		global.root_path = root;

		const updater = await createUpdater({ updateAutorestart: false });
		const result = await updater.updateProcess({
			name: moduleName,
			updateCommand: `"${process.execPath}" -p 1`
		});

		expect(result.error).toBe(false);
		expect(result.updated).toBe(true);
		expect(result.needRestart).toBe(true);
	});

	it("reports update command failures", async () => {
		const moduleName = "MMM-Test";
		const { root } = createTempModuleRoot(moduleName);
		global.root_path = root;

		const updater = await createUpdater();
		const result = await updater.updateProcess({
			name: moduleName,
			updateCommand: `"${process.execPath}" -e "process.exit(1)"`
		});

		expect(result).toEqual({ error: true, updated: false, needRestart: false });
	});

	it("does not restart from updateProcess when autoRestart is enabled", async () => {
		vi.useFakeTimers();

		const moduleName = "MMM-Test";
		const { root } = createTempModuleRoot(moduleName);
		global.root_path = root;

		const updater = await createUpdater({ updateAutorestart: true });
		const nodeRestartSpy = vi.spyOn(updater, "nodeRestart").mockImplementation(() => {});

		const result = await updater.updateProcess({
			name: moduleName,
			updateCommand: `"${process.execPath}" -p 1`
		});

		expect(result.error).toBe(false);
		expect(result.updated).toBe(true);
		expect(result.needRestart).toBe(false);

		vi.advanceTimersByTime(3000);
		expect(nodeRestartSpy).not.toHaveBeenCalled();
	});

	describe("parse", () => {

		/**
		 * Builds an updates config with one command per module.
		 * @param {string[]} moduleNames - Module names.
		 * @param {string} command - Update command for each module.
		 * @returns {Array<object>} Updates config.
		 */
		const updatesFor = (moduleNames, command = "git pull") => moduleNames.map((name) => ({ [name]: command }));

		/**
		 * Replaces updateProcess with a stub that records the call order and overlap.
		 * @param {object} updater - UpdateHelper instance.
		 * @param {object} results - Optional result per module name.
		 * @returns {{ calls: string[], maxRunning: () => number }} Recorded calls.
		 */
		const stubUpdateProcess = (updater, results = {}) => {
			const calls = [];
			let running = 0;
			let maxRunning = 0;
			vi.spyOn(updater, "updateProcess").mockImplementation(async (module) => {
				calls.push(module.name);
				running++;
				maxRunning = Math.max(maxRunning, running);
				await new Promise((resolve) => setTimeout(resolve, 5));
				running--;
				return results[module.name] ?? { error: false, updated: true, needRestart: true };
			});
			return { calls, maxRunning: () => maxRunning };
		};

		it("updates every module with a configured command, one after another", async () => {
			const names = ["MMM-A", "MMM-B", "MMM-C"];
			const updater = await createUpdater({ updates: updatesFor(names) });
			const recorded = stubUpdateProcess(updater);

			const result = await updater.parse(names.map((module) => ({ module })));

			expect(recorded.calls).toEqual(names);
			expect(recorded.maxRunning()).toBe(1);
			expect(result.map((state) => [state.name, state.updated, state.inProgress])).toEqual([
				["MMM-A", true, false],
				["MMM-B", true, false],
				["MMM-C", true, false]
			]);
			expect(updater.updating).toBe(false);
		});

		it("runs the real update commands of all modules", async () => {
			const names = ["MMM-A", "MMM-B"];
			const root = mkdtempSync(join(tmpdir(), "mm-updater-"));
			tempRoots.push(root);
			for (const name of names) {
				mkdirSync(join(root, "modules", name), { recursive: true });
			}
			global.root_path = root;

			const command = `"${process.execPath}" -e "require('node:fs').writeFileSync('updated', '')"`;
			const updater = await createUpdater({ updates: updatesFor(names, command) });

			const result = await updater.parse(names.map((module) => ({ module })));

			for (const name of names) {
				expect(existsSync(join(root, "modules", name, "updated"))).toBe(true);
			}
			expect(result.every((state) => state.updated && state.needRestart)).toBe(true);
		});

		it("skips modules without an update command", async () => {
			const updater = await createUpdater({ updates: updatesFor(["MMM-B"]) });
			const recorded = stubUpdateProcess(updater);

			const result = await updater.parse([{ module: "MMM-A" }, { module: "MMM-B" }]);

			expect(recorded.calls).toEqual(["MMM-B"]);
			expect(result.find((state) => state.name === "MMM-A").updated).toBe(false);
		});

		it("continues with the next module when an update fails", async () => {
			const names = ["MMM-A", "MMM-B"];
			const updater = await createUpdater({ updates: updatesFor(names) });
			const recorded = stubUpdateProcess(updater, { "MMM-A": { error: true, updated: false, needRestart: false } });

			const result = await updater.parse(names.map((module) => ({ module })));

			expect(recorded.calls).toEqual(names);
			expect(result.map((state) => [state.name, state.error, state.updated])).toEqual([
				["MMM-A", true, false],
				["MMM-B", false, true]
			]);
		});

		it("updates modules found in later checks", async () => {
			const updater = await createUpdater({ updates: updatesFor(["MMM-A", "MMM-B"]) });
			const recorded = stubUpdateProcess(updater);

			await updater.parse([{ module: "MMM-A" }]);
			await updater.parse([{ module: "MMM-B" }]);

			expect(recorded.calls).toEqual(["MMM-A", "MMM-B"]);
		});

		it("does not retry updated or failed modules in later checks", async () => {
			const names = ["MMM-A", "MMM-B"];
			const updater = await createUpdater({ updates: updatesFor(names) });
			const recorded = stubUpdateProcess(updater, { "MMM-B": { error: true, updated: false, needRestart: false } });

			await updater.parse(names.map((module) => ({ module })));
			await updater.parse(names.map((module) => ({ module })));

			expect(recorded.calls).toEqual(names);
		});

		it("does not start a second run while one is in progress", async () => {
			const names = ["MMM-A", "MMM-B"];
			const updater = await createUpdater({ updates: updatesFor(names) });
			const recorded = stubUpdateProcess(updater);

			const firstRun = updater.parse(names.map((module) => ({ module })));
			const secondResult = await updater.parse(names.map((module) => ({ module })));
			await firstRun;

			expect(Array.isArray(secondResult)).toBe(true);
			expect(recorded.calls).toEqual(names);
		});

		it("releases the update lock when an update throws", async () => {
			const updater = await createUpdater({ updates: updatesFor(["MMM-A"]) });
			vi.spyOn(updater, "updateProcess").mockRejectedValueOnce(new Error("boom"));

			await expect(updater.parse([{ module: "MMM-A" }])).rejects.toThrow("boom");

			expect(updater.updating).toBe(false);
			expect(updater.moduleList["MMM-A"].inProgress).toBe(false);
		});

		it("restarts once after all updates when autoRestart is enabled", async () => {
			const names = ["MMM-A", "MMM-B"];
			const updater = await createUpdater({ updates: updatesFor(names), updateAutorestart: true });
			const nodeRestartSpy = vi.spyOn(updater, "nodeRestart").mockImplementation(() => {});
			const recorded = stubUpdateProcess(updater, {
				"MMM-A": { error: false, updated: true, needRestart: false },
				"MMM-B": { error: false, updated: true, needRestart: false }
			});

			vi.useFakeTimers();
			const run = updater.parse(names.map((module) => ({ module })));
			await vi.advanceTimersByTimeAsync(5);
			expect(recorded.calls).toEqual(["MMM-A", "MMM-B"]);
			expect(nodeRestartSpy).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(5);
			await run;
			await vi.advanceTimersByTimeAsync(3000);

			expect(nodeRestartSpy).toHaveBeenCalledTimes(1);
		});

		it("does not restart when no update succeeded", async () => {
			vi.useFakeTimers();
			const updater = await createUpdater({ updates: updatesFor(["MMM-A"]), updateAutorestart: true });
			const nodeRestartSpy = vi.spyOn(updater, "nodeRestart").mockImplementation(() => {});
			vi.spyOn(updater, "updateProcess").mockResolvedValue({ error: true, updated: false, needRestart: false });

			await updater.parse([{ module: "MMM-A" }]);
			await vi.advanceTimersByTimeAsync(3000);

			expect(nodeRestartSpy).not.toHaveBeenCalled();
		});
	});

	describe("applyCommand", () => {
		it("returns the configured command for a module", async () => {
			const updater = await createUpdater({ updates: [{ "MMM-A": "git pull" }, { "MMM-B": "npm ci" }] });

			expect(updater.applyCommand("MMM-B")).toBe("npm ci");
			expect(updater.applyCommand("MMM-C")).toBeNull();
		});

		it("never returns a command for MagicMirror itself", async () => {
			const updater = await createUpdater({ updates: [{ MagicMirror: "git pull" }] });

			expect(updater.applyCommand("MagicMirror")).toBeNull();
		});
	});

	describe("nodeRestart", () => {
		it("exits without spawning when running under PM2", async () => {
			process.env.pm_id = "0";

			const updater = await createUpdater();
			const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});

			updater.nodeRestart();

			expect(exitSpy).toHaveBeenCalledWith(0);
			expect(spawnMock).not.toHaveBeenCalled();
		});

		it("spawns a detached child process when not running under PM2", async () => {
			delete process.env.pm_id;

			const updater = await createUpdater();
			const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});

			updater.nodeRestart();

			expect(spawnMock).toHaveBeenCalledOnce();
			expect(exitSpy).toHaveBeenCalledOnce();
			expect(exitSpy).not.toHaveBeenCalledWith(0);
		});
	});
});
