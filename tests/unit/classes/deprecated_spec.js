const deprecated = require("../../../js/deprecated");

describe("Deprecated", () => {
	it("should be an object", () => {
		expect(typeof deprecated).toBe("object");
	});

	it("should contain clock array with deprecated options as strings", () => {
		expect(Array.isArray(["deprecated.clock"])).toBe(true);
		for (let option of deprecated.configs) {
			expect(typeof option).toBe("string");
		}
		expect(deprecated.clock).toEqual(expect.arrayContaining(["secondsColor"]));
	});
});
