const { execFileSync } = require("node:child_process");
const path = require("node:path");

describe("logger caller prefixes", () => {
	const loggerPath = path.resolve(__dirname, "../../../js/logger.js");

	it.each(["js", "mjs", "cjs"])("recognizes .%s callers", (extension) => {
		const windowsScript = `C:\\MagicMirror\\js\\probe.${extension}`;
		const windowsModule = `C:\\MagicMirror\\modules\\MMM-test\\node_helper.${extension}`;
		const script = `
			require(${JSON.stringify(loggerPath)});
			const vm = require("node:vm");
			vm.runInThisContext('console.log("top-level");', {filename: "file:///MagicMirror/js/probe.${extension}"});
			vm.runInThisContext('(() => console.log("function"))();', {filename: "file:///MagicMirror/js/probe.${extension}"});
			vm.runInThisContext('console.log("module");', {filename: "file:///MagicMirror/modules/MMM-test/node_helper.${extension}"});
			vm.runInThisContext('console.log("windows script");', {filename: ${JSON.stringify(windowsScript)}});
			vm.runInThisContext('console.log("windows module");', {filename: ${JSON.stringify(windowsModule)}});
		`;
		const output = execFileSync(process.execPath, ["-e", script], {
			env: { ...process.env, mmTestMode: "false", FORCE_COLOR: "0" },
			encoding: "utf8"
		});

		expect(output).toContain("[probe] top-level");
		expect(output).toContain("[probe] function");
		expect(output).toContain("[MMM-test] module");
		expect(output).toContain("[probe] windows script");
		expect(output).toContain("[MMM-test] windows module");
	});
});
