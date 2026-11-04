import fs from "node:fs";
import path from "node:path";
import defaultModules from "../../../defaultmodules/defaultmodules.mjs";

const rootPath = path.resolve(import.meta.dirname, "../../..");

describe("Default modules set in defaultmodules/defaultmodules.mjs", () => {
	it("publishes the default module list globally", () => {
		expect(globalThis.defaultModules).toEqual(defaultModules);
	});

	for (const defaultModule of defaultModules) {
		it(`contains a folder for defaultmodules/${defaultModule}"`, () => {
			expect(fs.existsSync(path.join(rootPath, "defaultmodules", defaultModule))).toBe(true);
		});
	}
});
