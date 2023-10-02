/* MagicMirror² Test config sample for AnimateCSS integration with compliments module
 *
 * By bugsounet https://github.com/bugsounet
 * 09/2023
 * MIT Licensed.
 */
let config = {
	modules: [
		{
			module: "compliments",
			position: "lower_third",
			animateIn: "flipInX",
			animateOut: "flipOutX",
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
