Module.register("displaypower", {

	defaults: {
		driver: "auto",
		display: null,
		schedule: []
	},

	start () {
		Log.info(`Starting module: ${this.name}`);
		this.sendSocketNotification("CONFIG", this.config);
	},

	/**
	 * Accept DISPLAY_POWER notifications from other modules.
	 * Payload: { action: "on" | "off" }
	 */
	notificationReceived (notification, payload) {
		if (notification === "DISPLAY_POWER") {
			this.sendSocketNotification("SET_POWER", { action: payload.action });
		}
	},

	/**
	 * Re-broadcast power state changes so other modules can react.
	 * Emits DISPLAY_POWER_STATE with payload: { on: true | false }
	 */
	socketNotificationReceived (notification, payload) {
		if (notification === "POWER_STATE") {
			this.sendNotification("DISPLAY_POWER_STATE", payload);
		}
	}
});
