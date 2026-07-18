Module.register("wind", {
	defaults: {
		lat: 44.63,
		lon: -63.55,
		staleThresholdMinutes: 90,
		modelInterval: 10 * 60 * 1000,
		buoyInterval: 10 * 60 * 1000,
		forecastInterval: 30 * 60 * 1000,
		goodBelow: 10,
		cautionBelow: 20,
		groqApiKey: null
	},

	start () {
		this.model = null;
		this.buoy = null;
		this.forecast = null;
		this.sendSocketNotification("CONFIG", this.config);
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "WIND_MODEL") this.model = payload;
		else if (notification === "WIND_BUOY") this.buoy = payload;
		else if (notification === "WIND_FORECAST") this.forecast = payload;
		this.updateDom(300);
	},

	getTemplate () {
		return "templates/wind.njk";
	},

	getTemplateData () {
		let condition = null;
		if (this.model && !this.model.error) {
			const speed = this.model.speed;
			if (speed < this.config.goodBelow) condition = "great";
			else if (speed < this.config.cautionBelow) condition = "ok";
			else condition = "bad";
		}
		return {
			model: this.model,
			buoy: this.buoy,
			forecast: this.forecast,
			condition
		};
	}
});
