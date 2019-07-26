const expect = require("chai").expect;
const path = require("path");
const {JSDOM} = require("jsdom");

describe("Test function cmpVersions in js/module.js", function() {
	let cmp;

	before(function(done) {
		const dom = new JSDOM(`<script>var Class = {extend: function() { return {}; }};</script>\
				<script src="${path.join(__dirname, "..", "..", "..", "js", "module.js")}">`, { runScripts: "dangerously",
			resources: "usable" });
		dom.window.onload = function() {
			const {cmpVersions} = dom.window;
			cmp = cmpVersions;
			done();
		};
	});

	it("should return -1 when comparing 2.1 to 2.2", function() {
		expect(cmp("2.1", "2.2")).to.equal(-1);
	});

	it("should be return 0 when comparing 2.2 to 2.2", function() {
		expect(cmp("2.2", "2.2")).to.equal(0);
	});

	it("should be return 1 when comparing 1.1 to 1.0", function() {
		expect(cmp("1.1", "1.0")).to.equal(1);
	});
});
