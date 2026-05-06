const fs = require("node:fs");

const Log = require("../../../js/logger");
const { checkConfigFile } = require("../../../js/utils");

const createConfigObject = (modules) => ({
	configFilename: "config.js",
	configContentFull: "module.exports = { modules: [] };",
	fullConf: { modules }
});

const runCheck = (modules) => {
	checkConfigFile(createConfigObject(modules));
};

const expectExitForModules = (modules) => {
	vi.spyOn(process, "exit").mockImplementation((code) => {
		throw new Error(`process.exit:${code}`);
	});

	expect(() => {
		runCheck(modules);
	}).toThrow("process.exit:1");
};

describe("utils", () => {
	let originalReadFileSync;

	beforeEach(() => {
		originalReadFileSync = fs.readFileSync;

		vi.spyOn(fs, "readFileSync").mockImplementation((fileName, ...args) => {
			if (fileName === "index.html") {
				return "<div class=\"region top_bar\"></div>\n<div class=\"region lower_third\"></div>";
			}

			return originalReadFileSync.call(fs, fileName, ...args);
		});

		vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
		vi.spyOn(Log, "info").mockImplementation(() => {});
		vi.spyOn(Log, "warn").mockImplementation(() => {});
		vi.spyOn(Log, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("accepts valid module entries", () => {
		expect(() => {
			runCheck([
				{ module: "clock", position: "top_bar" },
				{ module: "newsfeed" }
			]);
		}).not.toThrow();
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("exits when modules is not an array", () => {
		expectExitForModules("not-an-array");
		expect(Log.error).toHaveBeenCalledWith("This module configuration contains errors:\nmodules must be an array");
	});

	it("exits when module field is missing or not a string", () => {
		expectExitForModules([{ module: 123, position: "top_bar" }]);
		expect(Log.error).toHaveBeenCalled();
		expect(Log.error.mock.calls[0][0]).toContain("module: must be a string");
	});

	it("warns for unknown positions without exiting", () => {
		const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
			throw new Error(`process.exit:${code}`);
		});

		expect(() => {
			runCheck([{ module: "clock", position: "made_up_region" }]);
		}).not.toThrow();
		expect(exitSpy).not.toHaveBeenCalled();
		expect(Log.warn).toHaveBeenCalled();
		expect(Log.warn.mock.calls[0][0]).toContain("uses unknown position");
	});
});
