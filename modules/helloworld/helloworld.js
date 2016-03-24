/* global Module */

/* Magic Mirror
 * Module: HelloWorld
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.create({

	// Default module config.
	defaults: {
		text: "Hello World!",
		classes: "normal medium"
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.className = this.config.classes;
		wrapper.innerHTML = this.config.text;  

		return wrapper;
	}
});

