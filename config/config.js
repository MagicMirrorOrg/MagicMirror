/* exported config */

/* Magic Mirror Config
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var config = {

	language: 'en',

	modules: [
		{
			module: 'clock',
			position: 'top_left'
		},
		{
			module: 'compliments',
			position: 'lower_third',
		},
		{
			module: 'helloworld',
			position: 'top_right'
		},
		{
			module: 'helloworld',
			position: 'bottom_bar',
			config: {
				text: 'Magic Mirror V2'
			}
		},
	]
	
};