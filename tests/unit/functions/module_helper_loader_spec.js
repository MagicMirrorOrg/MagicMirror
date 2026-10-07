import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { loadNodeHelper } from "../../../js/module_helper_loader.mjs";

describe("module helper loader", () => {
	let tempRoot;

	afterEach(() => {
		if (tempRoot) {
			rmSync(tempRoot, { recursive: true, force: true });
			tempRoot = undefined;
		}
	});

	const createHelperFile = (contents, packageType) => {
		tempRoot = mkdtempSync(join(tmpdir(), "mm-helper-loader-"));
		const helperPath = join(tempRoot, "node_helper.js");
		writeFileSync(join(tempRoot, "package.json"), JSON.stringify({ type: packageType }));
		writeFileSync(helperPath, contents);
		return helperPath;
	};

	it("loads and instantiates a CommonJS helper", async () => {
		const helperPath = createHelperFile("module.exports = class Helper { constructor () { this.format = 'commonjs'; } };", "commonjs");

		const helper = await loadNodeHelper(helperPath);

		expect(helper.format).toBe("commonjs");
	});

	it("loads and instantiates an ESM helper", async () => {
		const helperPath = createHelperFile("export default class Helper { constructor () { this.format = 'esm'; } }", "module");

		const helper = await loadNodeHelper(helperPath);

		expect(helper.format).toBe("esm");
	});

	it("rejects a helper without a default constructor export", async () => {
		const helperPath = createHelperFile("export const helper = true;", "module");

		await expect(loadNodeHelper(helperPath)).rejects.toThrow("must export a constructor");
	});
});
