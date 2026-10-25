import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const Log = require("logger");
const NodeHelper = require("../../js/node_helper.js");
const helpers = require("./helpers/global-setup.js");

describe("App restart lifecycle", () => {
	afterEach(async () => {
		await helpers.stopApplication(0);
		vi.restoreAllMocks();
	});

	it("reloads configuration without retaining stopped helpers or adding signal handlers", async () => {
		const startHelper = vi.spyOn(NodeHelper.prototype, "start");
		const stopHelper = vi.spyOn(NodeHelper.prototype, "stop");
		await helpers.startApplication("tests/configs/esm_helper.js");
		const app = globalThis.app;
		const sigintListeners = process.listenerCount("SIGINT");
		const sigtermListeners = process.listenerCount("SIGTERM");
		expect(startHelper).toHaveBeenCalledTimes(1);
		expect(globalThis.config.modules[0].module).toBe("esmHelper");

		await helpers.startApplication("tests/configs/modules/clock/clock_24hr.js");
		expect(globalThis.app).toBe(app);
		expect(globalThis.configuration_file).toBe("tests/configs/modules/clock/clock_24hr.js");
		expect(globalThis.config.modules[0].module).toBe("clock");
		expect(startHelper).toHaveBeenCalledTimes(1);
		expect(stopHelper).toHaveBeenCalledTimes(1);
		expect(process.listenerCount("SIGINT")).toBe(sigintListeners);
		expect(process.listenerCount("SIGTERM")).toBe(sigtermListeners);

		await app.stop();
		await app.stop();
		expect(stopHelper).toHaveBeenCalledTimes(1);
	});

	it.each([
		{ phase: "initialization", hook: "loaded", failure: "throw" },
		{ phase: "async initialization", hook: "loaded", failure: "reject" },
		{ phase: "setup", hook: "setExpressApp", failure: "throw" },
		{ phase: "async startup", hook: "start", failure: "reject" }
	])("continues startup when a node helper fails during $phase", async ({ phase, hook, failure }) => {
		const original = NodeHelper.prototype[hook];
		const helperHook = vi.spyOn(NodeHelper.prototype, hook).mockImplementation(function (...args) {
			if (this.name === "esmHelper") {
				const error = new Error(`${phase} failed`);
				if (failure === "reject") return Promise.reject(error);
				throw error;
			}
			return original.apply(this, args);
		});
		const startHelper = hook === "start" ? helperHook : vi.spyOn(NodeHelper.prototype, "start");
		const logMessage = vi.spyOn(Log, "log");
		const logError = vi.spyOn(Log, "error");

		const config = await helpers.startApplication("tests/configs/isolated_node_helper.js");

		expect(config.modules).toHaveLength(2);
		expect(logMessage).toHaveBeenCalledWith("Starting node helper for: calendar");
		expect(startHelper).toHaveBeenCalledTimes(hook === "start" ? 1 : 0);
		expect(logError).toHaveBeenCalledWith(expect.stringContaining("esmHelper"), expect.objectContaining({ message: `${phase} failed` }));
	});
});
