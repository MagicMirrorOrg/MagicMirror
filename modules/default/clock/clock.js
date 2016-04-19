/* global Log, Module, moment, config */

/* Magic Mirror
 * Module: Clock
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("clock",{

	// Module config defaults.
	defaults: {
		timeFormat: config.timeFormat,
		displaySeconds: true,
		showPeriod: true,
		showPeriodUpper: false,
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Schedule update interval.
		var self = this;
		setInterval(function() {
			self.updateDom();
		}, 1000);

		// Set locale.
		moment.locale(config.language);
	},

	// Override dom generator.
	getDom: function() {
		// Create wrappers.
		var wrapper = document.createElement("div");
		var dateWrapper = document.createElement("div");
		var timeWrapper = document.createElement("div");
		var secondsWrapper = document.createElement("sup");

		// Style Wrappers
		dateWrapper.className = "date normal medium";
		timeWrapper.className = "time bright large light";
		secondsWrapper.className = "dimmed";

		// Set content of wrappers.
		// The moment().format('h') method has a bug on the Raspberry Pi. 
		// So we need to generate the timestring manually.
		// See issue: https://github.com/MichMich/MagicMirror/issues/181
		var timeString = moment().format('HH:mm');
		if (this.config.timeFormat !== 24) {
			var now = new Date();
			var hours = now.getHours() % 12 || 12;
			if (this.config.showPeriod) {
				if (this.config.showPeriodUpper) {
					timeString = hours + moment().format(':mm A');
				} else {
					timeString = hours + moment().format(':mm a');
				}
			} else {
	    			timeString = hours + moment().format(':mm');
			}
		}

		dateWrapper.innerHTML = moment().format("dddd, LL");
		timeWrapper.innerHTML = timeString;
		secondsWrapper.innerHTML = moment().format("ss");

		// Combine wrappers.
		wrapper.appendChild(dateWrapper);
		wrapper.appendChild(timeWrapper);
		if (this.config.displaySeconds) {
			timeWrapper.appendChild(secondsWrapper);
		}

		// Return the wrapper to the dom.
		return wrapper;
	}
});
