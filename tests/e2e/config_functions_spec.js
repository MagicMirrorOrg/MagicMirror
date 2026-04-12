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
});
