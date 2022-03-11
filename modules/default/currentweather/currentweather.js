/* eslint-disable */

/* MagicMirror²
 * Module: CurrentWeather
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 *
 * This module is deprecated. Any additional feature will no longer be merged.
 */
Module.register("currentweather", {
	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);
	},

	// Override dom generator.
	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.className = this.config.tableClass;
		wrapper.innerHTML =
			"<style>text-decoration: none</style>" +
			"This module is deprecated since release v2.15 and removed with v2.19." +
			'<br>Please use the `weather` module as replacement, more info in the <a href="https://docs.magicmirror.builders/modules/weather.html" style="color: #ffffff">documentation</a>.';
		wrapper.className = "dimmed light small";
		return wrapper;
	},

	// Override getHeader method.
	getHeader: function () {
		return "deprecated currentweather";
	}
});
