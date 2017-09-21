/* global Module, WeatherProvider */

/* Magic Mirror
 * Module: Weather
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("weather",{

	// Default module config.
	defaults: {
		foo: "bar",
		weatherProvider: "openweathermap"
	},

	// Module properties.
	weatherProvider: null,

	// Return the scripts that are nessecery for the weather module.
	getScripts: function () {
		var scripts = [
			"weatherprovider.js",
			"weatherday.js"
		];

		// Add the provider file to the required scripts.
		scripts.push(this.file("providers/" + this.config.weatherProvider.toLowerCase() + ".js"))

		return scripts
	},

	// Start the weather module.
	start: function () {
		// Initialize the weather provider.
		this.weatherProvider = WeatherProvider.initialize(this.config.weatherProvider, this)

		// Let the weather provider know we are starting.
		this.weatherProvider.start()

		// Fetch the current weather. This is something we need to schedule.
		this.weatherProvider.fetchCurrentWeather()
	},

	// Generate the dom. This is now pretty simple for debugging.
	getDom: function() {
		var wrapper = document.createElement("div")

		wrapper.innerHTML += "Name: " + this.weatherProvider.providerName + "<br>"
		wrapper.innerHTML += JSON.stringify(this.weatherProvider.currentWeather())

		return wrapper
	},

	// What to do when the weather provider has new information available?
	updateAvailable: function() {
		Log.log("New weather information available.")
		console.info(this.weatherProvider.currentWeather())
		this.updateDom(0);
	}
});
