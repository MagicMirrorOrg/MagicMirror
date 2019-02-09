var http = require("http");
var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    start: function () {
    },

    socketNotificationReceived: function (notification, payload) {
        var self = this;

		if (notification === "AUTO_LOCATION") {
            console.log("Loading timezone...");
            http.get("http://ip-api.com/json", function (req) {
                var data = "";
                req.on("data", function (d) {
                    data += d;
                });
                req.on("end", function () {
                    var body = JSON.parse(data);
                    payload.location = body.city + ", " + body.regionName;
                    self.sendSocketNotification("UPDATE_LOCATION", payload);
                });
            }).on("error", function () {
                payload.error = "Could not figure out the timezone.";
                self.sendSocketNotification("UPDATE_LOCATION", payload);
            });
		}
	}
});
