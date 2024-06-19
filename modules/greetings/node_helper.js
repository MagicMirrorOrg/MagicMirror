const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({

	// Override start method.
	start () {
		Log.log(`Starting node helper for: ${this.name}`);
	},

	// Override socketNotificationReceived received.
	socketNotificationReceived (notification, payload) {
		if (notification === "ADD_GREETINGS") {
			// Notification received from module to establish connection
            // No further steps required
		} else if (notification === "FACE_ADDED" || notification === "FACE_REMOVED") {
            // Notification received from MQTT
            this.sendSocketNotification(notification, payload);
        }
	}
});
