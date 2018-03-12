const chai = require("chai");
const expect = chai.expect;
const deprecated = require("../../../js/deprecated");

describe("Deprecated", function() {
	it("should be an object", function() {
		expect(deprecated).to.be.an("object");
	});

	it("should contain configs array with deprecated options as strings", function() {
		expect(deprecated.configs).to.be.an("array");
		for (let option of deprecated.configs) {
			expect(option).to.be.an("string");
		}
		expect(deprecated.configs).to.include("kioskmode");
	});
});
