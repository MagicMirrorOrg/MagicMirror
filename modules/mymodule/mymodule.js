Module.register("mymodule",{

	// Default module config.
	defaults: {
		text: "Hello World!"
	},

	getTemplate: function () {
		return "mymodule.njk"
	},

	getTemplateData: function () {
		return this.config
	}
});
