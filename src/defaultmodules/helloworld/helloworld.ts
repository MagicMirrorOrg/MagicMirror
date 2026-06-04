Module.register("helloworld", {
	// Default module config.
	defaults: {
		text: "Hello World!"
	},

	getTemplate (): string {
		return "helloworld.njk";
	},

	getTemplateData (): any {
		return this.config;
	}
});
