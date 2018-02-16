const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const {JSDOM} = require("jsdom");

describe("File js/class", function() {
	describe("Test function cloneObject", function() {
		let clone;
		let dom;

		before(function(done) {
			dom = new JSDOM(`<script>var Log = {log: function() {}};</script>\
					<script src="${path.join(__dirname, "..", "..", "..", "js", "class.js")}">`, { runScripts: "dangerously",
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

		describe("Test lockstring code", function() {
			let log;

			before(function() {
                log = dom.window.Log.log;
                dom.window.Log.log = function cmp(str) {
                    expect(str).to.equal("lockStrings");
                };
			});

            after(function() {
                dom.window.Log.log = log;
            });

			it("should be return equals object and log lockStrings", function() {
                const expected = {name: "Module", lockStrings: "stringLock"};
				let obj = {};
				obj = clone(expected);
				expect(expected).to.deep.equal(obj);
			});

		});

	});
});

