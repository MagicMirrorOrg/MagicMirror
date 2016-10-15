Module.register("updatenotification", {



	defaults: {
		updateInterval: 10 * 60 * 1000, // every 10 minutes
	},

	status: false,

	start: function () {
		Log.log("Start updatenotification");
		var self = this;
	},

	notificationReceived: function(notification, payload, sender) {
		if (notification === "DOM_OBJECTS_CREATED") {
			this.sendSocketNotification("CONFIG", this.config);
		}
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "STATUS") {
			this.status = payload;
			this.updateDom(1000);
		}
	},

	// Override dom generator.
	getDom: function () {
		var wrapper = document.createElement("div");

		if (this.status && this.status.behind > 0) {
			var message = document.createElement("div");
			message.className = "small bright";

			var icon = document.createElement("i");
			icon.className = "fa fa-exclamation-circle";
			icon.innerHTML = "&nbsp;";
			message.appendChild(icon);

			var text = document.createElement("span");
			text.innerHTML = this.translate("UPDATE_NOTIFICATION");
			message.appendChild(text);

			wrapper.appendChild(message);

			var subtext = document.createElement("div");
			subtext.innerHTML = this.translate("UPDATE_INFO")
									.replace("COMMIT_COUNT", this.status.behind + " " + ((this.status.behind == 1)? 'commit' : 'commits'))
									.replace("BRANCH_NAME", this.status.current);
			subtext.className = "xsmall dimmed";
			wrapper.appendChild(subtext);
		}

		return wrapper;
	}
});
