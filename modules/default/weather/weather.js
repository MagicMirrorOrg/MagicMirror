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
		updateInterval: 10 * 60 * 1000,
		weatherProvider: "openweathermap",
		units: config.units,
		roundTemp: false
	},

	// Module properties.
	weatherProvider: null,

	// Define required scripts.
	getStyles: function() {
		return ["weather-icons.css", "weather.css"];
	},

	// Return the scripts that are nessecery for the weather module.
	getScripts: function () {
		var scripts = [
			"weatherprovider.js",
			"weatherobject.js"
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

		// Schedule the first update.
		this.scheduleUpdate(0)
	},

	// Generate the dom. This is now pretty simple for debugging.
	getDom: function() {
		return this.currentWeatherView(this.weatherProvider.currentWeather())
	},

	// What to do when the weather provider has new information available?
	updateAvailable: function() {
		Log.log("New weather information available.")
		console.info(this.weatherProvider.currentWeather())
		this.updateDom(0)
		this.scheduleUpdate()
	},

	scheduleUpdate: function(delay = null) {
		var nextLoad = this.config.updateInterval;
		if (delay !== null && delay >= 0) {
			nextLoad = delay;
		}

		setTimeout(() => {
			// Currently we are fetching the currentWeather.
			// In the future, it depends what we want to show.
			// So there needs to be some logic here...
			// if config.weatherType == 'current', do this...
			// if config.weatherType === 'forecast, do that ...
			this.weatherProvider.fetchCurrentWeather()
		}, nextLoad);
	},

	/* Views */

	// Generate the current weather view
	currentWeatherView: function (currentWeather) {
		var wrapper = document.createElement("div")

		if (currentWeather === null) {
			return wrapper
		}

		// Detail bar.

		var detailBar = document.createElement("div")

		this.addValueToWrapper(detailBar, null, "wi wi-strong-wind dimmed", "span", true) // Wind Icon
		this.addValueToWrapper(detailBar, currentWeather.windSpeed ? Math.round(currentWeather.windSpeed) : null) // WindSpeed
		this.addValueToWrapper(detailBar, currentWeather.windDirection ? this.translate(currentWeather.cardinalWindDirection()) + "&nbsp;&nbsp;" : null, "", "sup") // WindDirection	

		var now = new Date();
		var sunriseSunsetTime = (currentWeather.sunrise < now && currentWeather.sunset > now) ?  currentWeather.sunset : currentWeather.sunrise
		var sunriseSunsetIcon = (currentWeather.sunrise < now && currentWeather.sunset > now) ? "wi-sunset" : "wi-sunrise"
		this.addValueToWrapper(detailBar, null, "wi dimmed " + sunriseSunsetIcon, "span", true) // Sunrise / Sunset Icon
		this.addValueToWrapper(detailBar, moment(sunriseSunsetTime).format("HH:mm")) // Sunrise / Sunset Time

		detailBar.className = "normal medium"
		wrapper.appendChild(detailBar)

		// Main info

		var mainInfo = document.createElement("div")

		this.addValueToWrapper(mainInfo, null, "weathericon wi wi-" + currentWeather.weatherType, "span", true) // Wind Icon	
		this.addValueToWrapper(mainInfo, parseFloat(currentWeather.temperature).toFixed(this.config.roundTemp ? 0 : 1) + "&deg;", "bright" ) // WindSpeed

		mainInfo.className = "large light"
		wrapper.appendChild(mainInfo)

		return wrapper
	},

	// A convenience function to add an element to a wrapper with a specific value and class. 
	addValueToWrapper: function(wrapper, value, classNames, element = "span", forceAdd = false, addSpacer = true) {
		if (value === null && !forceAdd) {
			return
		}

		var valueWrapper = document.createElement(element)
		valueWrapper.className = classNames
		if (addSpacer) {
			valueWrapper.innerHTML = " "
		}

		if (value !== null) {
			valueWrapper.innerHTML += value
		}

		wrapper.appendChild(valueWrapper)
	}

});
