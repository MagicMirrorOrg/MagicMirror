const fs = require("node:fs");
const path = require("node:path");

const root_path = path.join(__dirname, "../../..");

describe("Default modules set in defaultmodules/defaultmodules.js", () => {
	const expectedDefaultModules = require(`${root_path}/defaultmodules/defaultmodules`);

	for (const defaultModule of expectedDefaultModules) {
		it(`contains a folder for defaultmodules/${defaultModule}"`, () => {
			expect(fs.existsSync(path.join(root_path, "defaultmodules", defaultModule))).toBe(true);
		});
	}
});
