var fs = require("fs");
var path = require("path");
var chai = require("chai");
var expect = chai.expect;
var vm = require("vm");


describe("Functions into modules/default/newsfeed/newsfeed.js", function() {

	Module = {}
	Module.definitions = {};
	Module.register = function (name, moduleDefinition) {
		Module.definitions[name] = moduleDefinition;
	};

	// load newsfeed.js
	require("../../../modules/default/newsfeed/newsfeed.js");

	describe("capitalizeFirstLetter", function() {
		words = {
			"rodrigo": "Rodrigo",
			"123m": "123m",
			"magic mirror": "Magic mirror",
			",a": ",a",
			"ñandú": "Ñandú",
			".!": ".!"
		};

		Object.keys(words).forEach(word => {
			it(`for ${word} should return ${words[word]}`, function() {
				expect(Module.definitions.newsfeed.capitalizeFirstLetter(word)).to.equal(words[word]);
			});
		});
	});

});

