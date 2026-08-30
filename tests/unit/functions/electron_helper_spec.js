const Log = require("logger");
const { applyElectronSwitches } = require("../../../js/electron_helper");

describe("electron switches", () => {
	let commandLine;

	beforeEach(() => {
		commandLine = {
			appendSwitch: vi.fn()
		};
		vi.spyOn(Log, "error").mockImplementation(() => {});
	});

	it("does nothing when electronSwitches is undefined", () => {
		applyElectronSwitches(commandLine, undefined);

		expect(commandLine.appendSwitch).not.toHaveBeenCalled();
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("applies string entries as switches without values", () => {
		applyElectronSwitches(commandLine, ["no-sandbox", "disable-http-cache"]);

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(2);
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(1, "no-sandbox");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(2, "disable-http-cache");
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("applies object entries as switches with values", () => {
		applyElectronSwitches(commandLine, [
			{ "js-flags": "--max-old-space-size=8192" },
			{ "password-store": "basic" }
		]);

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(2);
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(1, "js-flags", "--max-old-space-size=8192");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(2, "password-store", "basic");
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("allows one object entry to define multiple switches with values", () => {
		applyElectronSwitches(commandLine, [
			"no-sandbox",
			{
				"js-flags": "--max-old-space-size=8192",
				"password-store": "basic"
			}
		]);

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(3);
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(1, "no-sandbox");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(2, "js-flags", "--max-old-space-size=8192");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(3, "password-store", "basic");
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("logs an error for invalid entries", () => {
		applyElectronSwitches(commandLine, ["no-sandbox", ["js-flags", "--max-old-space-size=8192"], null]);

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(1);
		expect(commandLine.appendSwitch).toHaveBeenCalledWith("no-sandbox");
		expect(Log.error).toHaveBeenCalledTimes(2);
	});

	it("logs an error when electronSwitches is not an array", () => {
		applyElectronSwitches(commandLine, { "js-flags": "--max-old-space-size=8192" });

		expect(commandLine.appendSwitch).not.toHaveBeenCalled();
		expect(Log.error).toHaveBeenCalledWith(expect.stringContaining("electronSwitches must be an array of strings or objects"));
	});
});
