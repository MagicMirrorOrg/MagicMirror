/* global Class, cloneObject, Loader, MMSocket, nunjucks, Translator, Buttons */

Module.register("test_module", {
	// Default module config.
	defaults: {
		text: "Hello World!"
	},
	getTemplate: function () {
		return "test_module.njk";
	},
	// Define required scripts.
	getStyles: function () {
		return ["test_module.css"];
	},
	getTemplateData: function () {
		return this.config;
	},
	init: function () {
		return;
});
