var fs = require("fs");
var path = require("path");
var expect = require("chai").expect;
var vm = require("vm");

before(function() {
	var basedir = path.join(__dirname, "../../..");

	var fileName = "js/app.js";
	var filePath = path.join(basedir, fileName);
	var code = fs.readFileSync(filePath);

	this.sandbox = {
		module: {},
		__dirname: path.dirname(filePath),
		global: {},
		console: {
			log: function() { /*console.log("console.log(", arguments, ")");*/ }
		},
		process: {
			on: function() { /*console.log("process.on called with: ", arguments);*/ },
			env: {}
		}
	};

	this.sandbox.require = function(filename) {
		// This modifies the global slightly,
		// but supplies vm with essential code
		return require(filename);
	};

	vm.runInNewContext(code, this.sandbox, fileName);
});

after(function() {
	//console.log(global);
});

describe("'global.root_path' set in js/app.js", function() {
	var expectedSubPaths = [
		"modules",
		"serveronly",
		"js",
		"js/app.js",
		"js/main.js",
		"js/electron.js",
		"config"
	];

	expectedSubPaths.forEach(subpath => {
		it(`contains a file/folder "${subpath}"`, function() {
			expect(fs.existsSync(path.join(this.sandbox.global.root_path, subpath))).to.equal(true);
		});
	});

	it("should not modify global.root_path for testing", function() {
		expect(global.root_path).to.equal(undefined);
	});

	it("should not modify global.version for testing", function() {
		expect(global.version).to.equal(undefined);
	});

	it("should expect the global.version equals package.json file", function() {
		versionPackage = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
		expect(this.sandbox.global.version).to.equal(versionPackage);
	});
});
