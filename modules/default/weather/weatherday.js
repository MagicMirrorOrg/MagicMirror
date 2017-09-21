/* global Class */

/* Magic Mirror
 * Module: Weather
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * This class is the blueprint for a day which includes weather information.
 */

// Currently this is focused on the information which is nessecery for the current weather.
// As soon as we start implementing the forecast, mode properties will be added.

class WeatherDay {
	constructor() {
		this.windSpeed = null
		this.windDirection = null
		this.sunrise = null
		this.sunset = null
		this.temperature = null
		this.weatherType = null
	}
};