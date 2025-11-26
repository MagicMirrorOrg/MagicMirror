const NodeHelper = require("node_helper");
const Log = require("logger");
const { readConfig, getServerInfo } = require("#server_functions");

module.exports = NodeHelper.create({
	// Override start method.
	start () {
		Log.log(`Starting node helper for: ${this.name}`);
	},

	// Override socketNotificationReceived.
	socketNotificationReceived (notification, payload) {
		if (notification === "GET_ADMIN_INFO") {
			this.fetchAdminInfo();
		}
	},

	/**
	 * Fetch admin server information
	 */
	fetchAdminInfo () {
		try {
			const config = readConfig();
			const serverInfo = getServerInfo(config);
			this.sendSocketNotification("ADMIN_INFO", {
				success: true,
				serverInfo: serverInfo
			});
		} catch (error) {
			Log.error(`[AdminInfo] Error fetching admin info: ${error.message}`);
			this.sendSocketNotification("ADMIN_INFO", {
				success: false,
				error: error.message || "Failed to get server info"
			});
		}
	}
});

