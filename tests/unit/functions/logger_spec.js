const { execFileSync } = require("node:child_process");
const path = require("node:path");

describe("logger caller prefixes", () => {
	const loggerPath = path.resolve(__dirname, "../../../js/logger.js");

	it.each(["js", "mjs", "cjs"])("recognizes .%s callers", (extension) => {
		const script = `
			require(${JSON.stringify(loggerPath)});
			const vm = require("node:vm");
			vm.runInThisContext('console.log("top-level");', {filename: "file:///MagicMirror/js/probe.${extension}"});
			vm.runInThisContext('(() => console.log("function"))();', {filename: "file:///MagicMirror/js/probe.${extension}"});
			vm.runInThisContext('console.log("module");', {filename: "file:///MagicMirror/modules/MMM-test/node_helper.${extension}"});
		`;
		const output = execFileSync(process.execPath, ["-e", script], {
			env: { ...process.env, mmTestMode: "false", FORCE_COLOR: "0" },
			encoding: "utf8"
		});

		expect(output).toContain("[probe] top-level");
		expect(output).toContain("[probe] function");
		expect(output).toContain("[MMM-test] module");
	});
});
