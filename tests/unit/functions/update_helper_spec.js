import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("UpdateHelper", () => {
	const originalEnv = { ...process.env };
	const tempRoots = [];

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
		global.version = "test";
		global.root_path = process.cwd();
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
	function createTempModuleRoot (moduleName) {
		const root = mkdtempSync(join(tmpdir(), "mm-updater-"));
		const modulePath = join(root, "modules", moduleName);
		mkdirSync(modulePath, { recursive: true });
		tempRoots.push(root);
		return { root, modulePath };
	}

	/**
	 * Creates a fresh UpdateHelper instance for testing.
	 * @param {object} config - Optional config overrides.
	 * @returns {Promise<object>} Resolved UpdateHelper instance.
	 */
	async function createUpdater (config = {}) {
		const updateHelperModule = await import("../../../defaultmodules/updatenotification/update_helper");
		const UpdateHelper = updateHelperModule.default || updateHelperModule;
		return new UpdateHelper({ updates: [], updateTimeout: 1000, updateAutorestart: false, ...config });
	}

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

	it("schedules node restart when autoRestart is enabled", async () => {
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
		expect(nodeRestartSpy).not.toHaveBeenCalled();

		vi.advanceTimersByTime(3000);
		expect(nodeRestartSpy).toHaveBeenCalledTimes(1);
	});
});
