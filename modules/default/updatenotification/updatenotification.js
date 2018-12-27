Module.register("updatenotification", {

	defaults: {
		updateInterval: 10 * 60 * 1000, // every 10 minutes
	},

	status: false,

	start: function () {
		Log.log("Start updatenotification");

	},

	notificationReceived: function (notification, payload, sender) {
		if (notification === "DOM_OBJECTS_CREATED") {
			this.sendSocketNotification("CONFIG", this.config);
			this.sendSocketNotification("MODULES", Module.definitions);
			this.hide(0, { lockString: self.identifier });
		}
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "STATUS") {
			this.status = payload;
			this.updateUI();
		}
	},

	updateUI: function () {
		var self = this;
		if (this.status && this.status.behind > 0) {
			self.updateDom(0);
			self.show(1000, { lockString: self.identifier });
		}
	},

	diffLink: function(text) {
		var localRef = this.status.hash;
		var remoteRef = this.status.tracking.replace(/.*\//, "");
		return "<a href=\"https://github.com/MichMich/MagicMirror/compare/"+localRef+"..."+remoteRef+"\" "+
			"class=\"xsmall dimmed\" "+
			"style=\"text-decoration: none;\" "+
			"target=\"_blank\" >" +
			text +
			"</a>";
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

			var updateInfoKeyName = this.status.behind == 1 ? "UPDATE_INFO_SINGLE" : "UPDATE_INFO_MULTIPLE";
			var subtextHtml = this.translate(updateInfoKeyName, {
				COMMIT_COUNT: this.status.behind,
				BRANCH_NAME: this.status.current
			});

			var text = document.createElement("span");
			if (this.status.module == "default") {
				text.innerHTML = this.translate("UPDATE_NOTIFICATION");
				subtextHtml = this.diffLink(subtextHtml);
			} else {
				text.innerHTML = this.translate("UPDATE_NOTIFICATION_MODULE", {
					MODULE_NAME: this.status.module
				});
			}
			message.appendChild(text);

			wrapper.appendChild(message);

			var subtext = document.createElement("div");
			subtext.innerHTML = subtextHtml;
			subtext.className = "xsmall dimmed";
			wrapper.appendChild(subtext);
		}

		return wrapper;
	}
});
