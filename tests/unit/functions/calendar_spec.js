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
			it(`for ${word} should return ${words[word]}`, function() {
				expect(Module.definitions.calendar.capFirst(word)).to.equal(words[word]);
			});
		});
	});
});

