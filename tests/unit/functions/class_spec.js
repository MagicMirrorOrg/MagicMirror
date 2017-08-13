var chai = require("chai");
var expect = chai.expect;
var jsClass = require("../../../js/class.js");

describe("File js/class", function() {
	describe("Test function cloneObject", function() {
		var cloneObject = jsClass._test.cloneObject;

		it("should be return equals object", function() {
			var expected = {name: "Rodrigo", web: "https://rodrigoramirez.com", project: "MagicMirror"};
			var obj = {};
			obj = cloneObject(expected);
			expect(expected).to.deep.equal(obj);
		});

		it("should be return equals int", function() {
			var expected = 1;
			var obj = {};
			obj = cloneObject(expected);
			expect(expected).to.equal(obj);
		});

		it("should be return equals string", function() {
			var expected = "Perfect stranger";
			var obj = {};
			obj = cloneObject(expected);
			expect(expected).to.equal(obj);
		});

		it("should be return equals undefined", function() {
			var expected = undefined;
			var obj = {};
			obj = cloneObject(expected);
			expect(undefined).to.equal(obj);
		});

		// CoverageME
		/*
		context("Test lockstring code", function() {
			it("should be return equals object", function() {
				var expected = {name: "Module", lockStrings: "stringLock"};
				var obj = {};
				obj = cloneObject(expected);
				expect(expected).to.deep.equal(obj);
			});
		});
		*/

	});
});

