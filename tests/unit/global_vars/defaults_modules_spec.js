const fs = require("fs");
const path = require("path");
const vm = require("vm");

const basedir = path.join(__dirname, "../../..");

const mockedWarn = () => {};
const originalWarn = console.log;

beforeAll(function () {
	const fileName = "js/app.js";
	const filePath = path.join(basedir, fileName);
	const code = fs.readFileSync(filePath);

	console.log = mockedWarn;

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
		return require(filename);
	};

	vm.runInNewContext(code, sandbox, fileName);
});

afterAll(function () {
	console.log = originalWarn;
});

describe("Default modules set in modules/default/defaultmodules.js", function () {
	const expectedDefaultModules = require("../../../modules/default/defaultmodules");

	for (const defaultModule of expectedDefaultModules) {
		it(`contains a folder for modules/default/${defaultModule}"`, function () {
			expect(fs.existsSync(path.join(sandbox.global.root_path, "modules/default", defaultModule))).toBe(true);
		});
	}
});
