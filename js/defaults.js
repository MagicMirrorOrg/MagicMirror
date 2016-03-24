/* exported defaults */

/* Magic Mirror
 * Config Defauls
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var defaults = {

	language: 'en',

	modules: [
		{
			module: 'helloworld',
			position: 'upper_third',
			config: {
				text: 'Magic Mirror V2',
				classes: 'large thin'
			}
		},
		{
			module: 'helloworld',
			position: 'middle_center',
			config: {
				text: 'Please create a config file.'
			}
		},
		{
			module: 'helloworld',
			position: 'middle_center',
			config: {
				text: 'See README for more information.',
				classes: 'small dimmed'
			}
		},
		{
			module: 'helloworld',
			position: 'bottom_bar',
			config: {
				text: 'www.michaelteeuw.nl',
				classes: 'xsmall dimmed'
			}
		},
	],

	paths: {
		modules: 'modules',
		vendor: 'vendor'
	},
};