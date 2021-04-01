const fs = require("fs");
const path = require("path");
const expect = require("chai").expect;
const vm = require("vm");

const basedir = path.join(__dirname, "../../..");

before(function () {
	const fileName = "js/app.js";
	const filePath = path.join(basedir, fileName);
	const code = fs.readFileSync(filePath);

	this.sandbox = {
		module: {},
		__dirname: path.dirname(filePath),
		global: {},
		console: {
			log: function () {
				/*console.log("console.log(", arguments, ")");*/
			}
		},
		process: {
			on: function () {
				/*console.log("process.on called with: ", arguments);*/
			},
			env: {}
		}
	};

	this.sandbox.require = function (filename) {
		// This modifies the global slightly,
		// but supplies vm with essential code
		return require(filename);
	};

	vm.runInNewContext(code, this.sandbox, fileName);
});

describe("Default modules set in modules/default/defaultmodules.js", function () {
	const expectedDefaultModules = require("../../../modules/default/defaultmodules");

	for (const defaultModule of expectedDefaultModules) {
		it(`contains a folder for modules/default/${defaultModule}"`, function () {
			expect(fs.existsSync(path.join(this.sandbox.global.root_path, "modules/default", defaultModule))).to.equal(true);
		});
	}
});
