describe("Functions into modules/default/newsfeed/newsfeed.js", function () {
	// Fake for use by newsletter.js
	Module = {};
	Module.definitions = {};
	Module.register = function (name, moduleDefinition) {
		Module.definitions[name] = moduleDefinition;
	};

	beforeAll(function () {
		// load newsfeed.js
		require("../../../modules/default/newsfeed/newsfeed.js");
	});

	test.skip("skip", () => {});
});
