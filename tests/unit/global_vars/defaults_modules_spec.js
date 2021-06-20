const fs = require("fs");
const path = require("path");
const vm = require("vm");

const basedir = path.join(__dirname, "../../..");

beforeAll(function () {
	const fileName = "js/app.js";
	const filePath = path.join(basedir, fileName);
	const code = fs.readFileSync(filePath);

	sandbox = {
		module: {},
		__dirname: path.dirname(filePath),
		global: {},
		process: {
			on: function () {},
			env: {}
		}
	};

	sandbox.require = function (filename) {
		// This modifies the global slightly,
		// but supplies vm with essential code
		if (filename === "logger") {
			return require("../mocks/logger.js");
		} else {
			try {
				return require(filename);
			} catch {
				// ignore
			}
		}
	};

	vm.runInNewContext(code, sandbox, fileName);
});

describe("Default modules set in modules/default/defaultmodules.js", function () {
	const expectedDefaultModules = require("../../../modules/default/defaultmodules");

	for (const defaultModule of expectedDefaultModules) {
		it(`contains a folder for modules/default/${defaultModule}"`, function () {
			expect(fs.existsSync(path.join(sandbox.global.root_path, "modules/default", defaultModule))).toBe(true);
		});
	}
});
