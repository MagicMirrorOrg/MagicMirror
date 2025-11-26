Module.register("admininfo", {
	// Default module config.
	defaults: {
		updateInterval: 60 * 1000, // Check every minute
		showProtocol: true, // Show http:// or https://
		showPort: true, // Show port number
		showPath: true, // Show /admin path
		format: "full" // "full" (http://ip:port/admin) or "ip-only" or "url-only"
	},

	// Module properties.
	adminUrl: null,
	serverInfo: null,
	updateTimer: null,
	loaded: false,

	// Define required styles.
	getStyles () {
		return ["admininfo.css"];
	},

	// Define start sequence.
	start () {
		Log.info(`Starting module: ${this.name}`);
		this.loaded = false;
		this.sendSocketNotification("GET_ADMIN_INFO");
	},

	// Override socket notification handler.
	socketNotificationReceived (notification, payload) {
		if (notification === "ADMIN_INFO") {
			this.serverInfo = payload;
			this.formatAdminUrl();
			this.loaded = true;
			this.updateDom();
		}
	},

	/**
	 * Format the admin URL based on config
	 */
	formatAdminUrl () {
		if (!this.serverInfo || !this.serverInfo.success) {
			this.adminUrl = "Unable to determine admin URL";
			return;
		}

		const info = this.serverInfo.serverInfo;

		if (this.config.format === "ip-only") {
			this.adminUrl = `${info.address}:${info.port}`;
		} else if (this.config.format === "url-only") {
			this.adminUrl = "/admin";
		} else {
			// full format
			let url = "";
			if (this.config.showProtocol) {
				url += `${info.protocol}://`;
			}
			url += info.address;
			if (this.config.showPort) {
				url += `:${info.port}`;
			}
			if (this.config.showPath) {
				url += "/admin";
			}
			this.adminUrl = url;
		}
	},

	/**
	 * Schedule the next update
	 */
	scheduleUpdate () {
		// Clear existing timer
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}

		this.updateTimer = setTimeout(() => {
			this.sendSocketNotification("GET_ADMIN_INFO");
			this.scheduleUpdate();
		}, this.config.updateInterval);
	},

	// Override getTemplate method.
	getTemplate () {
		return "admininfo.njk";
	},

	// Override getTemplateData method.
	getTemplateData () {
		return {
			adminUrl: this.adminUrl || "Loading...",
			loaded: this.loaded
		};
	},

	/**
	 * Called when module is about to be hidden
	 */
	suspend () {
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}
	},

	/**
	 * Called when module is about to be shown
	 */
	resume () {
		// Resume updates if needed
		if (!this.updateTimer && this.loaded) {
			this.scheduleUpdate();
		}
	}
});

