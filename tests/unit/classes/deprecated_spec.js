const deprecated = require("../../../js/deprecated");

describe("Deprecated", function () {
	it("should be an object", function () {
		expect(typeof deprecated).toBe("object");
	});

	it("should contain configs array with deprecated options as strings", function () {
		expect(Array.isArray(["deprecated.configs"])).toBe(true);
		for (let option of deprecated.configs) {
			expect(typeof option).toBe("string");
		}
		expect(deprecated.configs).toEqual(expect.arrayContaining(["kioskmode"]));
	});
});
