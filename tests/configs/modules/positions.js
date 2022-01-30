/* MagicMirror² Test config for position setters module using the helloworld module
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
let config = {
	modules:
		// Using exotic content. This is why don't accept go to JSON configuration file
		(function () {
			let positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third", "middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right", "bottom_bar", "fullscreen_above", "fullscreen_below"];
			let modules = Array();
			for (let idx in positions) {
				modules.push({
					module: "helloworld",
					position: positions[idx],
					config: {
						text: "Text in " + positions[idx]
					}
				});
			}
			return modules;
		})()
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
