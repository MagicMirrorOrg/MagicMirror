/* global Module */

/* Magic Mirror
 * Module: TransitTime
 *
 * By Omri Shiv
 * MIT Licensed.
 */

Module.register("transittime",{

	// Default module config.
	defaults: {
		text: "Transit Time:",
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,
		origin: "",
		destination: "",
	},

	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);		
		this.transitTime = null;

		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);
		this.updateTimer = null;

	},
	getScripts: function() {
		return [this.file('gmaps.js')]
	},
	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.innerHTML = this.config.text;
		
		var large = document.createElement("div");
		large.className = "large light";
		
		var transitTime = document.createElement("span");
		transitTime.className = "bright";
		transitTime.innerHTML = " " + this.transitTime + "";
		
		large.appendChild(transitTime);
		wrapper.appendChild(large);
		
		return wrapper;
	},

	updateTransit: function() {
		var totalTime = 0;
		var self = this;
		var retry = true;
		var directionsService = new google.maps.DirectionsService();
		var origin = this.config.origin;
    	var destination = this.config.destination;
	    var request = {
			origin: origin,
			destination: destination,
			travelMode: google.maps.TravelMode.DRIVING
		};
		
		directionsService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				for (i = 0; i < response.routes[0].legs.length; i++) {
					totalTime += response.routes[0].legs[i].duration.value;
				}
				if (totalTime/60 < 60){
					totalTime = Math.floor(totalTime/60/60) + "h" + Math.floor(totalTime/60) + "m"
				} else {
					totalTime = Math.floor(totalTime/60/60) + "h" + Math.floor(totalTime%60) + "m"
				}
			}
			self.processTransit(totalTime);
		});
		
		if (retry) {
			self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
		}
	},
	processTransit: function(time) {
		this.transitTime = time;
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.updateTransit();
		}, nextLoad);
	}
});
