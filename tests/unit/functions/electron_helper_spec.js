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

	it("always applies the autoplay-policy default switch", () => {
		applyElectronSwitches(commandLine, undefined);

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(1);
		expect(commandLine.appendSwitch).toHaveBeenCalledWith("autoplay-policy", "no-user-gesture-required");
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("applies string entries as switches without values", () => {
		applyElectronSwitches(commandLine, ["no-sandbox", "disable-http-cache"]);

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(3);
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(1, "autoplay-policy", "no-user-gesture-required");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(2, "no-sandbox");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(3, "disable-http-cache");
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("applies object entries as switches with values", () => {
		applyElectronSwitches(commandLine, [
			{ "js-flags": "--max-old-space-size=8192" },
			{ "password-store": "basic" }
		]);

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(3);
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(1, "autoplay-policy", "no-user-gesture-required");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(2, "js-flags", "--max-old-space-size=8192");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(3, "password-store", "basic");
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

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(4);
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(1, "autoplay-policy", "no-user-gesture-required");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(2, "no-sandbox");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(3, "js-flags", "--max-old-space-size=8192");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(4, "password-store", "basic");
		expect(Log.error).not.toHaveBeenCalled();
	});

	it("logs an error for invalid entries", () => {
		applyElectronSwitches(commandLine, ["no-sandbox", ["js-flags", "--max-old-space-size=8192"], null]);

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(2);
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(1, "autoplay-policy", "no-user-gesture-required");
		expect(commandLine.appendSwitch).toHaveBeenNthCalledWith(2, "no-sandbox");
		expect(Log.error).toHaveBeenCalledTimes(2);
	});

	it("logs an error when electronSwitches is not an array", () => {
		applyElectronSwitches(commandLine, { "js-flags": "--max-old-space-size=8192" });

		expect(commandLine.appendSwitch).toHaveBeenCalledTimes(1);
		expect(commandLine.appendSwitch).toHaveBeenCalledWith("autoplay-policy", "no-user-gesture-required");
		expect(Log.error).toHaveBeenCalledWith(expect.stringContaining("electronSwitches must be an array of strings or objects"));
	});
});
