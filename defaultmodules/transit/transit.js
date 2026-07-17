Module.register("transit", {
	defaults: {
		stopId: "",
		routes: [],
		maxArrivals: 5,
		updateInterval: 30 * 1000
	},

	start () {
		this.arrivals = null; // null = not yet received; [] = received but empty
		this.sendSocketNotification("CONFIG", this.config);
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "TRANSIT_DATA") {
			this.arrivals = payload.arrivals;
			this.updateDom(300);
		}
	},

	getTemplate () {
		return "templates/transit.njk";
	},

	getTemplateData () {
		return { arrivals: this.arrivals };
	}
});
