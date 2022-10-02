describe("Functions into modules/default/newsfeed/newsfeed.js", () => {
	// Fake for use by newsletter.js
	Module = {};
	Module.definitions = {};
	Module.register = (name, moduleDefinition) => {
		Module.definitions[name] = moduleDefinition;
	};

	beforeAll(() => {
		// load newsfeed.js
		require("../../../modules/default/newsfeed/newsfeed.js");
	});

	test.skip("skip", () => {});
});
