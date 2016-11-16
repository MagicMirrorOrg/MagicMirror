var SimpleGit = require("simple-git");
var simpleGits = [];
var fs = require("fs");
var path = require("path");
var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

	config: {},

	updateTimer: null,

	start: function () {
		var srcdir = __dirname + "/../../";
		fs.readdir(srcdir, function(err, names) {
			if (err) {
				console.error("Error reading dir " + srcdir + ": " + err);
				return;
			}

			names.filter(function(name) {
				return fs.statSync(path.join(srcdir, name)).isDirectory() && name != "node_modules";
			}).forEach(function(name) {
				simpleGits.push({"module": name, "git": SimpleGit(path.join(srcdir, name))});
			});
		});
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "CONFIG") {
			this.config = payload;
			this.preformFetch();
		}
	},

	preformFetch() {
		var self = this;

		simpleGits.forEach(function(sg) {
			sg.git.fetch().status(function(err, data) {
				data.module = sg.module;
				if (!err) {
					self.sendSocketNotification("STATUS", data);
				}
			});
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
