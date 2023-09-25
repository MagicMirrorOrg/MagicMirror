/* MagicMirror² Test config sample for AnimateCSS integration with compliments module
 * --> inversed name animation : in for out and vice versa (must return no animation)
 * By bugsounet https://github.com/bugsounet
 * 09/2023
 * MIT Licensed.
 */
let config = {
	modules: [
		{
			module: "compliments",
			position: "lower_third",
			animateIn: "flipOutX",
			animateOut: "flipInX",
			config: {
				compliments: {
					anytime: ["AnimateCSS Testing..."]
				},
				updateInterval: 2000,
				fadeSpeed: 1000
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
