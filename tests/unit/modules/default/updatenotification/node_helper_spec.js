import Module from "node:module";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const loadNodeHelper = async (config) => {
	vi.resetModules();
	global.config = config;
	global.root_path = process.cwd();
	global.defaultModulesDir = "defaultmodules";

	const UpdateHelper = vi.fn();
	const originalRequire = Module.prototype.require;

	// Use the real base NodeHelper so getServerModuleConfig() is exercised as the
	// actual inherited method, but stub the git/update helpers to avoid I/O.
	Module.prototype.require = function (id) {
		if (id === "node_helper") {
			return originalRequire.call(this, path.resolve(process.cwd(), "js/node_helper.js"));
		}

		if (id === "./git_helper") {
			return vi.fn();
		}

		if (id === "./update_helper") {
			return UpdateHelper;
		}

		return originalRequire.apply(this, arguments);
	};

	let HelperClass;
	try {
		const helperModule = await import("../../../../../defaultmodules/updatenotification/node_helper");
		HelperClass = helperModule.default || helperModule;
	} finally {
		Module.prototype.require = originalRequire;
	}

	const helper = new HelperClass();
	helper.name = "updatenotification";

	return { helper, UpdateHelper };
};

afterEach(() => {
	delete global.config;
	delete global.root_path;
	delete global.defaultModulesDir;
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
});
