const fs = require("node:fs");
const path = require("node:path");

const root_path = path.join(__dirname, "../../..");

describe("Default modules set in default/modules/defaultmodules.js", () => {
	const expectedDefaultModules = require(`${root_path}/default/modules/defaultmodules`);

	for (const defaultModule of expectedDefaultModules) {
		it(`contains a folder for default/modules/${defaultModule}"`, () => {
			expect(fs.existsSync(path.join(root_path, "default/modules", defaultModule))).toBe(true);
		});
	}
});
