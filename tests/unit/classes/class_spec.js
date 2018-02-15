const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const {JSDOM} = require("jsdom");

describe("File js/class", function() {
	describe("Test function cloneObject", function() {
        let clone;

        before(function(done) {
            const dom = new JSDOM(`<script src="${path.join(__dirname, "..", "..", "..", "js", "class.js")}">`, { runScripts: "dangerously",
                resources: "usable" });
            dom.window.onload = function() {
                const {cloneObject} = dom.window;
                clone = cloneObject;
                done();
            };
        });

		it("should be return equals object", function() {
            const expected = {name: "Rodrigo", web: "https://rodrigoramirez.com", project: "MagicMirror"};
            let obj = {};
			obj = clone(expected);
			expect(expected).to.deep.equal(obj);
		});

		it("should be return equals int", function() {
            const expected = 1;
			let obj = {};
			obj = clone(expected);
			expect(expected).to.equal(obj);
		});

		it("should be return equals string", function() {
            const expected = "Perfect stranger";
			let obj = {};
			obj = clone(expected);
			expect(expected).to.equal(obj);
		});

		it("should be return equals undefined", function() {
            const expected = undefined;
			let obj = {};
			obj = clone(expected);
			expect(undefined).to.equal(obj);
		});

		// CoverageME
		/*
		context("Test lockstring code", function() {
			it("should be return equals object", function() {
				const expected = {name: "Module", lockStrings: "stringLock"};
				let obj = {};
				obj = clone(expected);
				expect(expected).to.deep.equal(obj);
			});
		});
		*/

	});
});

