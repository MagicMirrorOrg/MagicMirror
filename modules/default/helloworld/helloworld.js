Module.register("helloworld", {
	// Default module config.
	defaults: {
		text: "Hello World!"
	},

	getTemplate () {
		return "helloworld.njk";
	},

	getTemplateData () {
		return this.config;
	}
});
