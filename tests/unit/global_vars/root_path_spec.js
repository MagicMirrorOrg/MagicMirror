var fs = require("fs");
var path = require("path");
var chai = require("chai");
var expect = chai.expect;

describe("'global.root_path' set in js/app.js", function() {
	var appMM =  require("../../../js/app.js")

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
			expect(fs.existsSync(path.join(global.root_path, subpath))).to.equal(true);
		});
	});
});

