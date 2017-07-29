var fs = require("fs");
var path = require("path");
var chai = require("chai");
var expect = chai.expect;
var vm = require("vm");


describe("Functions into modules/default/calendar/calendar.js", function() {

	// Fake for use by calendar.js
	Module = {}
	Module.definitions = {};
	Module.register = function (name, moduleDefinition) {
		Module.definitions[name] = moduleDefinition;
	};

	// load calendar.js
	require("../../../modules/default/calendar/calendar.js");

	describe("capFirst", function() {
		words = {
			"rodrigo": "Rodrigo",
			"123m": "123m",
			"magic mirror": "Magic mirror",
			",a": ",a",
			"ñandú": "Ñandú"
		};

		Object.keys(words).forEach(word => {
			it(`for '${word}' should return '${words[word]}'`, function() {
				expect(Module.definitions.calendar.capFirst(word)).to.equal(words[word]);
			});
		});
	});

	describe("shorten", function() {
		strings = {
			" String with whitespace at the beginning that needs trimming" : { length: 16, return: "String with whit&hellip;" },
			"long string that needs shortening": { length: 16, return: "long string that&hellip;" },
			"short string": { length: 16, return: "short string" },
			"long string with no maxLength defined": { return: "long string with no maxLength defined" },
		};

		Object.keys(strings).forEach(string => {
			it(`for '${string}' should return '${strings[string].return}'`, function() {
				expect(Module.definitions.calendar.shorten(string, strings[string].length)).to.equal(strings[string].return);
			});
		});

		it("should return an empty string if shorten is called with a non-string", function () {
			expect(Module.definitions.calendar.shorten(100)).to.equal("");
		});

		it("should not shorten the string if shorten is called with a non-number maxLength", function () {
			expect(Module.definitions.calendar.shorten("This is a test string", "This is not a number")).to.equal("This is a test string");
		});

		it("should wrap the string instead of shorten it if shorten is called with wrapEvents = true (with maxLength defined as 20)", function () {
			expect(Module.definitions.calendar.shorten(
				"This is a wrapEvent test. Should wrap the string instead of shorten it if called with wrapEvent = true",
				20,
				true)).to.equal("This is a <br>wrapEvent test. Should wrap <br>the string instead of <br>shorten it if called with <br>wrapEvent = true");
		});

		it("should wrap the string instead of shorten it if shorten is called with wrapEvents = true (without maxLength defined, default 25)", function () {
			expect(Module.definitions.calendar.shorten(
				"This is a wrapEvent test. Should wrap the string instead of shorten it if called with wrapEvent = true",
				undefined,
				true)).to.equal("This is a wrapEvent <br>test. Should wrap the string <br>instead of shorten it if called <br>with wrapEvent = true");
		});
	});
});

