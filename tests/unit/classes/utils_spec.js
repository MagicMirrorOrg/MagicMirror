var expect = require("chai").expect;
var Utils = require("../../../js/utils.js");
var colors = require("colors/safe");

describe("Utils", function() {
	describe("colors", function() {
		var colorsEnabled = colors.enabled;

		afterEach(function() {
			colors.enabled = colorsEnabled;
		});

		it("should have info, warn and error properties", function() {
			expect(Utils.colors).to.have.property("info");
			expect(Utils.colors).to.have.property("warn");
			expect(Utils.colors).to.have.property("error");
		});

		it("properties should be functions", function() {
			expect(Utils.colors.info).to.be.a("function");
			expect(Utils.colors.warn).to.be.a("function");
			expect(Utils.colors.error).to.be.a("function");
		});

		it("should print colored message in supported consoles", function() {
			colors.enabled = true;
			expect(Utils.colors.info("some informations")).to.be.equal("\u001b[34msome informations\u001b[39m");
			expect(Utils.colors.warn("a warning")).to.be.equal("\u001b[33ma warning\u001b[39m");
			expect(Utils.colors.error("ERROR!")).to.be.equal("\u001b[31mERROR!\u001b[39m");
		});

		it("should print message in unsupported consoles", function() {
			colors.enabled = false;
			expect(Utils.colors.info("some informations")).to.be.equal("some informations");
			expect(Utils.colors.warn("a warning")).to.be.equal("a warning");
			expect(Utils.colors.error("ERROR!")).to.be.equal("ERROR!");
		});
	});
});
