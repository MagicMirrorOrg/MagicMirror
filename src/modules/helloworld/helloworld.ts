Module.register("helloworld", {
	// Default module config.
	defaults: {
		text: "Hello World!"
	},

	getTemplate (): string {
		return "helloworld.njk";
	},

	getTemplateData (): object {
		return this.config;
	}
});
