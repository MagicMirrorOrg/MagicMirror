const expect = require("chai").expect;

describe("Functions into modules/default/newsfeed/newsfeed.js", function () {
	// Fake for use by newsletter.js
	Module = {};
	Module.definitions = {};
	Module.register = function (name, moduleDefinition) {
		Module.definitions[name] = moduleDefinition;
	};

	before(function () {
		// load newsfeed.js
		require("../../../modules/default/newsfeed/newsfeed.js");
	});
});
