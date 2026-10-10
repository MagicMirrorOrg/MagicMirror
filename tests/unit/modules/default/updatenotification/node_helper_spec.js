import { afterEach, describe, expect, it, vi } from "vitest";

const UpdateHelper = vi.hoisted(() => vi.fn());

vi.mock("../../../../../defaultmodules/updatenotification/update_helper.js", () => ({ default: UpdateHelper }));
vi.mock("../../../../../defaultmodules/updatenotification/git_helper.js", () => ({ default: vi.fn() }));

const loadNodeHelper = async (config) => {
	vi.resetModules();
	global.config = config;
	global.root_path = process.cwd();

	// Use the real base NodeHelper so getServerModuleConfig() is exercised as the
	// actual inherited method; the git and update helpers are mocked to avoid I/O.
	const helperModule = await import("../../../../../defaultmodules/updatenotification/node_helper.js");
	const HelperClass = helperModule.default;

	const helper = new HelperClass();
	helper.name = "updatenotification";

	return { helper, UpdateHelper };
};

afterEach(() => {
	delete global.config;
	delete global.root_path;
	vi.resetAllMocks();
	vi.resetModules();
});

describe("updatenotification node helper", () => {
	it("uses server configuration for update commands", async () => {
		const trustedUpdates = [{ "MMM-Test": "git pull" }];
		const { helper, UpdateHelper } = await loadNodeHelper({
			modules: [{ module: "updatenotification", config: { updates: trustedUpdates, updateTimeout: 2000 } }]
		});
		const clientConfig = { updates: [{ "MMM-Test": "rm -rf /" }], updateInterval: 1000, updateTimeout: 1 };

		await helper.socketNotificationReceived("CONFIG", clientConfig);

		const [updateConfig] = UpdateHelper.mock.calls[0];
		expect(updateConfig.updates).toEqual(trustedUpdates);
		expect(updateConfig.updateTimeout).toBe(2000);
		expect(updateConfig.updateInterval).toBe(1000);
	});

	it("ignores client update commands when the server config has none", async () => {
		const { helper, UpdateHelper } = await loadNodeHelper({
			modules: [{ module: "updatenotification", config: {} }]
		});
		const clientConfig = { updates: [{ "MMM-Test": "rm -rf /" }], updateInterval: 1000 };

		await helper.socketNotificationReceived("CONFIG", clientConfig);

		const [updateConfig] = UpdateHelper.mock.calls[0];
		expect(updateConfig.updates).toEqual([]);
		expect(updateConfig.updateInterval).toBe(1000);
	});

	it("ignores client update commands when the module is not configured", async () => {
		const { helper, UpdateHelper } = await loadNodeHelper({ modules: [] });
		const clientConfig = { updates: [{ "MMM-Test": "rm -rf /" }], updateInterval: 1000 };

		await helper.socketNotificationReceived("CONFIG", clientConfig);

		const [updateConfig] = UpdateHelper.mock.calls[0];
		expect(updateConfig.updates).toEqual([]);
		expect(updateConfig.updateInterval).toBe(1000);
	});

	it("processes updates with the update helper", async () => {
		const updates = [{ module: "MMM-Test" }];
		const parse = vi.fn().mockResolvedValue([]);
		UpdateHelper.mockImplementation(function () {
			this.parse = parse;
		});
		const { helper } = await loadNodeHelper({
			modules: [{ module: "updatenotification", config: { sendUpdatesNotifications: false } }]
		});

		await helper.socketNotificationReceived("CONFIG", { updateInterval: 1000 });
		helper.gitHelper.getRepos = vi.fn().mockResolvedValue([]);
		helper.gitHelper.checkUpdates = vi.fn().mockResolvedValue(updates);
		helper.scheduleNextFetch = vi.fn();
		await helper.performFetch();

		expect(parse).toHaveBeenCalledWith(updates);
	});
});
