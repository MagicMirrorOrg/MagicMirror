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
		displayType: 'digital', // options: digital, analog, both

		timeFormat: config.timeFormat,
		displaySeconds: true,
		showPeriod: true,
		showPeriodUpper: false,
		clockBold: false,
		showDate: true,

		/* specific to the analog clock */
		analogSize: '200px',
		analogFace: 'simple', // options: 'none', 'simple', 'face-###' (where ### is 001 to 012 inclusive)
		analogPlacement: 'bottom', // options: 'top', 'bottom', 'left', 'right'
		analogShowDate: 'top', // options: false, 'top', or 'bottom'
		secondsColor: '#888888',
	},
	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},
	// Define styles.
	getStyles: function() {
		return ["clock_styles.css"];
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

		var wrapper = document.createElement("div");

		/************************************
		 * Create wrappers for DIGITAL clock
		 */

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
		if(this.config.showDate){
		dateWrapper.innerHTML = moment().format("dddd, LL");
		}
		timeWrapper.innerHTML = timeString;
		secondsWrapper.innerHTML = moment().format("ss");
		if (this.config.showPeriodUpper) {
			periodWrapper.innerHTML = moment().format("A");
		} else {
			periodWrapper.innerHTML = moment().format("a");
		}
		if (this.config.displaySeconds) {
			timeWrapper.appendChild(secondsWrapper);
		}
		if (this.config.showPeriod && this.config.timeFormat !== 24) {
			timeWrapper.appendChild(periodWrapper);
		}
		if (this.config.displaySeconds) {
			timeWrapper.appendChild(secondsWrapper);
		}
		if (this.config.showPeriod && this.config.timeFormat !== 24) {
			timeWrapper.appendChild(periodWrapper);
		}

		/****************************************************************
		 * Create wrappers for ANALOG clock, only if specified in config
		 */

		 if (this.config.displayType !== 'digital') {
			// If it isn't 'digital', then an 'analog' clock was also requested

			// Calculate the degree offset for each hand of the clock
			var now = moment(),
				second = now.seconds() * 6,
				minute = now.minute() * 6 + second / 60,
				hour = ((now.hours() % 12) / 12) * 360 + 90 + minute / 12;

			// Create wrappers
			var wrapper = document.createElement("div");
			var clockCircle = document.createElement("div");
			clockCircle.className = "clockCircle";
			clockCircle.style.width = this.config.analogSize;
			clockCircle.style.height = this.config.analogSize;

			if (this.config.analogFace != '' && this.config.analogFace != 'simple' && this.config.analogFace != 'none') {
				clockCircle.style.background = "url("+ this.data.path + "faces/" + this.config.analogFace + ".svg)";
				clockCircle.style.backgroundSize = "100%";
			} else if (this.config.analogFace != 'none') {
				clockCircle.style.border = "2px solid white";
			}
			var clockFace = document.createElement("div");
			clockFace.className = "clockFace";

			var clockHour = document.createElement("div");
			clockHour.id = "clockHour";
			clockHour.style.transform = "rotate(" + hour + "deg)";
			clockHour.className = "clockHour";
			var clockMinute = document.createElement("div");
			clockMinute.id = "clockMinute";
			clockMinute.style.transform = "rotate(" + minute + "deg)";
			clockMinute.className = "clockMinute";

			// Combine analog wrappers
			clockFace.appendChild(clockHour);
			clockFace.appendChild(clockMinute);

			if (this.config.displaySeconds) {
				var clockSecond = document.createElement("div");
				clockSecond.id = "clockSecond";
				clockSecond.style.transform = "rotate(" + second + "deg)";
				clockSecond.className = "clockSecond";
				clockSecond.style.backgroundColor = this.config.secondsColor;
				clockFace.appendChild(clockSecond);
			}
			clockCircle.appendChild(clockFace);
		}

		/*******************************************
		 * Combine wrappers, check for .displayType
		 */

		if (this.config.displayType === 'digital') {
			// Display only a digital clock
			wrapper.appendChild(dateWrapper);
			wrapper.appendChild(timeWrapper);
		} else if (this.config.displayType === 'analog') {
			// Display only an analog clock
			dateWrapper.style.textAlign = "center";
			dateWrapper.style.paddingBottom = "15px";
			if (this.config.analogShowDate === 'top') {
				wrapper.appendChild(dateWrapper);
				wrapper.appendChild(clockCircle);
			} else if (this.config.analogShowDate === 'bottom') {
				wrapper.appendChild(clockCircle);
				wrapper.appendChild(dateWrapper);
			} else {
				wrapper.appendChild(clockCircle);
			}
		} else {
			// Both clocks have been configured, check position
			var placement = this.config.analogPlacement;

			analogWrapper = document.createElement("div");
			analogWrapper.id = "analog";
			analogWrapper.style.cssFloat = "none";
			analogWrapper.appendChild(clockCircle);
			digitalWrapper = document.createElement("div");
			digitalWrapper.id = "digital";
			digitalWrapper.style.cssFloat = "none";
			digitalWrapper.appendChild(dateWrapper);
			digitalWrapper.appendChild(timeWrapper);

			if (placement === 'left' || placement === 'right') {
				digitalWrapper.style.display = "inline-block";
				digitalWrapper.style.verticalAlign = "top";
				analogWrapper.style.display = "inline-block";
				if (placement === 'left') {
					analogWrapper.style.padding = "0 20px 0 0";
					wrapper.appendChild(analogWrapper);
					wrapper.appendChild(digitalWrapper);
				} else {
					analogWrapper.style.padding = "0 0 0 20px";
					wrapper.appendChild(digitalWrapper);
					wrapper.appendChild(analogWrapper);
				}
			} else {
				digitalWrapper.style.textAlign = "center";
				if (placement === 'top') {
					analogWrapper.style.padding = "0 0 20px 0";
					wrapper.appendChild(analogWrapper);
					wrapper.appendChild(digitalWrapper);
				} else {
					analogWrapper.style.padding = "20px 0 0 0";
					wrapper.appendChild(digitalWrapper);					
					wrapper.appendChild(analogWrapper);
				}
			}
		}

		// Return the wrapper to the dom.
		return wrapper;
	}
});