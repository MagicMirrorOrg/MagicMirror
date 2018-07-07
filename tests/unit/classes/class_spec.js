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

		it("should clone object", function() {
			const expected = {name: "Rodrigo", web: "https://rodrigoramirez.com", project: "MagicMirror"};
			const obj = clone(expected);
			expect(obj).to.deep.equal(expected);
			expect(expected === obj).to.equal(false);
		});

		it("should clone array", function() {
			const expected = [1, null, undefined, "TEST"];
			const obj = clone(expected);
			expect(obj).to.deep.equal(expected);
			expect(expected === obj).to.equal(false);
		});

		it("should clone number", function() {
			let expected = 1;
			let obj = clone(expected);
			expect(obj).to.equal(expected);

			expected = 1.23;
			obj = clone(expected);
			expect(obj).to.equal(expected);
		});

		it("should clone string", function() {
			const expected = "Perfect stranger";
			const obj = clone(expected);
			expect(obj).to.equal(expected);
		});

		it("should clone undefined", function() {
			const expected = undefined;
			const obj = clone(expected);
			expect(obj).to.equal(expected);
		});

		it("should clone null", function() {
			const expected = null;
			const obj = clone(expected);
			expect(obj).to.equal(expected);
		});

		it("should clone nested object", function() {
			const expected = {
				name: "fewieden",
				link: "https://github.com/fewieden",
				versions: ["2.0", "2.1", "2.2"],
				answerForAllQuestions: 42,
				properties: {
					items: [{foo: "bar"}, {lorem: "ipsum"}],
					invalid: undefined,
					nothing: null
				}
			};
			const obj = clone(expected);
			expect(obj).to.deep.equal(expected);
			expect(expected === obj).to.equal(false);
			expect(expected.versions === obj.versions).to.equal(false);
			expect(expected.properties === obj.properties).to.equal(false);
			expect(expected.properties.items === obj.properties.items).to.equal(false);
			expect(expected.properties.items[0] === obj.properties.items[0]).to.equal(false);
			expect(expected.properties.items[1] === obj.properties.items[1]).to.equal(false);
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

			it("should clone object and log lockStrings", function() {
				const expected = {name: "Module", lockStrings: "stringLock"};
				const obj = clone(expected);
				expect(obj).to.deep.equal(expected);
				expect(expected === obj).to.equal(false);
			});
		});
	});
});

