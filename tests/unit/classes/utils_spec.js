/*
 * Note from KristjanESPERANTO:
 * TODO: This test no longer tests our own code but only ansis. In my opinion, the color test can be removed, instead we need a test for logSystemInformation.
 */

const colors = require("ansis");

describe("Utils", () => {
	describe("colors", () => {
		const colorsEnabled = colors.enabled;

		afterEach(() => {
			colors.enabled = colorsEnabled;
		});

		it("should have info, warn and error properties", () => {
			expect(colors).toHaveProperty("info");
			expect(colors).toHaveProperty("warn");
			expect(colors).toHaveProperty("error");
		});

		it("properties should be functions", () => {
			expect(typeof colors.info).toBe("function");
			expect(typeof colors.warn).toBe("function");
			expect(typeof colors.error).toBe("function");
		});

		it("should print colored message in supported consoles", () => {
			colors.enabled = true;
			expect(colors.info("some informations")).toBe("\u001b[34msome informations\u001b[39m");
			expect(colors.warn("a warning")).toBe("\u001b[33ma warning\u001b[39m");
			expect(colors.error("ERROR!")).toBe("\u001b[31mERROR!\u001b[39m");
		});

		it("should print message in unsupported consoles", () => {
			colors.enabled = false;
			expect(colors.info("some informations")).toBe("some informations");
			expect(colors.warn("a warning")).toBe("a warning");
			expect(colors.error("ERROR!")).toBe("ERROR!");
		});
	});
});
