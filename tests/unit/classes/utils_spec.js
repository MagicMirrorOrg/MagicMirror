const Utils = require("../../../js/utils.js");
const colors = require("colors/safe");

describe("Utils", function () {
	describe("colors", function () {
		const colorsEnabled = colors.enabled;

		afterEach(function () {
			colors.enabled = colorsEnabled;
		});

		it("should have info, warn and error properties", function () {
			expect(Utils.colors).toHaveProperty("info");
			expect(Utils.colors).toHaveProperty("warn");
			expect(Utils.colors).toHaveProperty("error");
		});

		it("properties should be functions", function () {
			expect(typeof Utils.colors.info).toBe("function");
			expect(typeof Utils.colors.warn).toBe("function");
			expect(typeof Utils.colors.error).toBe("function");
		});

		it("should print colored message in supported consoles", function () {
			colors.enabled = true;
			expect(Utils.colors.info("some informations")).toBe("\u001b[34msome informations\u001b[39m");
			expect(Utils.colors.warn("a warning")).toBe("\u001b[33ma warning\u001b[39m");
			expect(Utils.colors.error("ERROR!")).toBe("\u001b[31mERROR!\u001b[39m");
		});

		it("should print message in unsupported consoles", function () {
			colors.enabled = false;
			expect(Utils.colors.info("some informations")).toBe("some informations");
			expect(Utils.colors.warn("a warning")).toBe("a warning");
			expect(Utils.colors.error("ERROR!")).toBe("ERROR!");
		});
	});
});
