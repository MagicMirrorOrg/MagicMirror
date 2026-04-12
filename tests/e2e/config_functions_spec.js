const helpers = require("./helpers/global-setup");

describe("config with module function", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/config_functions.js");
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("config should resolve module functions", () => {
		expect(config.modules[0].config.moduleFunctions.roundToInt1(13.3)).toBe(13);
		expect(config.modules[0].config.moduleFunctions.roundToInt2(13.3)).toBe(13);
	});

	it("config should not revive plain strings containing arrow or function keywords", () => {
		expect(config.modules[0].config.stringWithArrow).toBe("a => b is not a function");
		expect(config.modules[0].config.stringWithFunction).toBe("this function keyword is just text");
	});
});
