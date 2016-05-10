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
		clockBold: false
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
		var periodWrapper = document.createElement("span");
		// Style Wrappers
		dateWrapper.className = "date normal medium";
		timeWrapper.className = "time bright large light";
		secondsWrapper.className = "dimmed";

		// Set content of wrappers.
		// The moment().format("h") method has a bug on the Raspberry Pi.
		// So we need to generate the timestring manually.
		// See issue: https://github.com/MichMich/MagicMirror/issues/181
		var timeString;
		if (this.config.clockBold === true) {
			timeString = moment().format("HH[<span class=\"bold\">]mm[</span>]");
		} else {
			timeString = moment().format("HH:mm");
		}

		if (this.config.timeFormat !== 24) {
			// var now = new Date();
			// var hours = now.getHours() % 12 || 12;
			if (this.config.clockBold === true) {
				//timeString = hours + moment().format("[<span class=\"bold\">]mm[</span>]");
				timeString = moment().format("h[<span class=\"bold\">]mm[</span>]");
			} else {
				//timeString = hours + moment().format(":mm");
				timeString = moment().format("h:mm");
			}
		}
		dateWrapper.innerHTML = moment().format("dddd, LL");
		timeWrapper.innerHTML = timeString;
		secondsWrapper.innerHTML = moment().format("ss");
		if (this.config.showPeriodUpper) {
			periodWrapper.innerHTML = moment().format("A");
		} else {
			periodWrapper.innerHTML = moment().format("a");
		}
		// Combine wrappers.
		wrapper.appendChild(dateWrapper);
		wrapper.appendChild(timeWrapper);
		if (this.config.displaySeconds) {
			timeWrapper.appendChild(secondsWrapper);
		}
		if (this.config.showPeriod && this.config.timeFormat !== 24) {
			timeWrapper.appendChild(periodWrapper);
		}
		// Return the wrapper to the dom.
		return wrapper;
	}
});
