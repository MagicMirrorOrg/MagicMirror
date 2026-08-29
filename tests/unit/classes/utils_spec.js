const fs = require("node:fs");

const Log = require("../../../js/logger");
const { checkConfigFile, ConfigError } = require("../../../js/utils");

const createConfigObject = (modules, configContentFull = "module.exports = { modules: [] };") => ({
	configFilename: "config.js",
	configContentFull,
	fullConf: { modules }
});

const runCheck = (modules, configContentFull) => {
	checkConfigFile(createConfigObject(modules, configContentFull));
};

const expectConfigErrorForModules = (modules) => {
	expect(() => {
		runCheck(modules);
	}).toThrow(ConfigError);
	expect(process.exit).not.toHaveBeenCalled();
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
		vi.spyOn(process, "exit").mockImplementation(() => {});
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

	it("throws when modules is not an array", () => {
		expectConfigErrorForModules("not-an-array");
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("throws when module field is missing or not a string", () => {
		expectConfigErrorForModules([{ module: 123, position: "top_bar" }]);
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("warns for unknown positions without exiting", () => {
		expect(() => {
			runCheck([{ module: "clock", position: "made_up_region" }]);
		}).not.toThrow();
		expect(process.exit).not.toHaveBeenCalled();
		expect(Log.warn).toHaveBeenCalled();
		expect(Log.warn.mock.calls[0][0]).toContain("uses unknown position");
	});

	it("throws syntax errors with their lint details", () => {
		expect(() => {
			runCheck([], "module.exports = { modules: [ };");
		}).toThrow(/Your configuration file contains syntax errors/);
		expect(process.exit).not.toHaveBeenCalled();
	});
});
