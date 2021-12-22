const fs = require("fs");
const path = require("path");

const root_path = path.join(__dirname, "../../..");

describe("Default modules set in modules/default/defaultmodules.js", function () {
	const expectedDefaultModules = require("../../../modules/default/defaultmodules");

	for (const defaultModule of expectedDefaultModules) {
		it(`contains a folder for modules/default/${defaultModule}"`, function () {
			expect(fs.existsSync(path.join(root_path, "modules/default", defaultModule))).toBe(true);
		});
	}
});
