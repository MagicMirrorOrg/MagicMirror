var simpleGit = require("simple-git")(__dirname + "/../..");
var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

	config: {},

	updateTimer: null,

	start: function () {
		
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "CONFIG") {
			this.config = payload;
			this.preformFetch();
		}
	},

	preformFetch() {
		var self = this;
		simpleGit.fetch().status(function(err, data) {
			if (!err) {
				self.sendSocketNotification("STATUS", data);
			}
		});

		this.scheduleNextFetch(this.config.updateInterval);
	},

	scheduleNextFetch: function(delay) {
		if (delay < 60 * 1000) {
			delay = 60 * 1000
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.preformFetch();
		}, delay);
	}

});
