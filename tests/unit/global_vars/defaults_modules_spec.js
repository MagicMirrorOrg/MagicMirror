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

describe("Default modules set in modules/default/defaultmodules.js", function() {

	var expectedDefaultModules = [
		"alert",
		"calendar",
		"clock",
		"compliments",
		"currentweather",
		"helloworld",
		"newsfeed",
		"weatherforecast",
		"updatenotification"
	];

	expectedDefaultModules.forEach(defaultModule => {
		it(`contains default module "${defaultModule}"`, function() {
			expect(this.sandbox.defaultModules).to.include(defaultModule);
		});
	});

	expectedDefaultModules.forEach(defaultModule => {
		it(`contains a folder for modules/default/${defaultModule}"`, function() {
			expect(fs.existsSync(path.join(this.sandbox.global.root_path, "modules/default", defaultModule))).to.equal(true);
		});
	});
});
