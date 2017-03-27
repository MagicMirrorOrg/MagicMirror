var fs = require("fs");
var path = require("path");
var chai = require("chai");
var expect = chai.expect;
var vm = require("vm");


describe("Functions module currentweather", function() {

	// Fake for use by calendar.js
	Module = {}
	Module.definitions = {};
	Module.register = function (name, moduleDefinition) {
		Module.definitions[name] = moduleDefinition;
	};
	config = {};

	describe("roundValue", function() {
		describe("this.config.roundTemp is true", function() {
			// load currentweather
			require("../../../modules/default/currentweather/currentweather.js");

			Module.definitions.currentweather.config = {};
			Module.definitions.currentweather.config.roundTemp = true;

			var values = [
				// index 0 value
				// index 1 expect
				[1      ,  "1"],
				[1.0    ,  "1"],
				[1.02   ,  "1"],
				[10.12  , "10"],
				[2.0    ,  "2"],
				["2.12" ,  "2"],
				[10.1   , "10"]
			]

			values.forEach(value => {
				it(`for ${value[0]} should be return ${value[1]}`, function() {
					expect(Module.definitions.currentweather.roundValue(value[0])).to.equal(value[1]);
				});
			});
		});
	});
});
