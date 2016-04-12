/* exported defaults */

/* Magic Mirror
 * Config Defauls
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var defaults = {
	port: 8080,

	language: "en",
	timeFormat: 24,

	modules: [
		{
			module: "helloworld",
			position: "upper_third",
			classes: "large thin",
			config: {
				text: "Magic Mirror<sup>2</sup>"
			}
		},
		{
			module: "helloworld",
			position: "middle_center",
			config: {
				text: "Please create a config file."
			}
		},
		{
			module: "helloworld",
			position: "middle_center",
			classes: "small dimmed",
			config: {
				text: "See README for more information."
			}
		},
		{
			module: "helloworld",
			position: "bottom_bar",
			classes: "xsmall dimmed",
			config: {
				text: "www.michaelteeuw.nl"
			}
		},
	],

	paths: {
		modules: "modules",
		vendor: "vendor"
	},
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = defaults;}
