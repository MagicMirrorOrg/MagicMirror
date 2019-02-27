var http = require("http");
var NodeHelper = require("node_helper");
var request = require("request");

module.exports = NodeHelper.create({
	start: function () {
	},

	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification === "AUTO_LOCATION") {
			request("http://localhost:8080/location", function (err, res, body) {
				if (!err && res.statusCode === 200) {
					var location = JSON.parse(body);
					payload.location = location.city + ", " + location.regionName;
					self.sendSocketNotification("UPDATE_LOCATION", payload);
					return;
				}
				payload.error = "Could not figure out the timezone.";
				self.sendSocketNotification("LOCATION_ERROR", payload);
			});
		}
	}
});
