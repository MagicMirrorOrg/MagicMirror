const fs = require("node:fs");
const path = require("node:path");

const root_path = path.join(__dirname, "../../..");

describe("Default modules set in modules/default/defaultmodules.js", () => {
	const expectedDefaultModules = require(`${root_path}/modules/default/defaultmodules`);

	for (const defaultModule of expectedDefaultModules) {
		it(`contains a folder for modules/default/${defaultModule}"`, () => {
			expect(fs.existsSync(path.join(root_path, "modules/default", defaultModule))).toBe(true);
		});
	}
});
