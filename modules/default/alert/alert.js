/* global Module */

/* Magic Mirror
 * Module: alert
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

Module.register("alert",{
	defaults: {
		// scale|slide|genie|jelly|flip|bouncyflip|exploader
		effect: "slide",
		// scale|slide|genie|jelly|flip|bouncyflip|exploader
		alert_effect: "jelly",
		//time a notification is displayed in seconds
		display_time: 3500,
		//Position
		position: "center",
		//shown at startup
		welcome_message: "Welcome, start was successful!"
	},
	getScripts: function() {
		return ["classie.js", "modernizr.custom.js", "notificationFx.js"];
	},
	getStyles: function() {
		return ["ns-default.css"];
	},
	show_notification: function(message) {
		if (this.config.effect == "slide") {this.config.effect = this.config.effect + "-" + this.config.position;}
		message = "<span class='thin' style='line-height: 35px; font-size:24px' color='#4A4A4A'>" + message.title + "</span><br /><span class='light' style='font-size:28px;line-height: 30px;'>" + message.message + "</span>";
		new NotificationFx({
			message: message,
			layout: "growl",
			effect: this.config.effect,
			ttl: this.config.display_time
		}).show();
	},
	show_alert: function(params, sender) {
		var self = this;
		//Set standard params if not provided by module
		if (typeof params.timer === "undefined") { params.timer = null; }
		if (typeof params.imageHeight === "undefined") { params.imageHeight = "80px"; }
		if (typeof params.imageUrl === "undefined") {
			params.imageUrl = null;
			image = "";
		} else {
			image = "<img src='" + (params.imageUrl).toString() + "' height=" + (params.imageHeight).toString() + " style='margin-bottom: 10px;'/><br />";
		}
		//Create overlay
		var overlay = document.createElement("div");
		overlay.id = "overlay";
		overlay.innerHTML += "<div class=\"black_overlay\"></div>";
		document.body.insertBefore(overlay, document.body.firstChild);

		//If module already has an open alert close it
		if (this.alerts[sender.name]) {
			this.hide_alert(sender);
		}

		message = "<span class='light' style='line-height: 35px; font-size:30px' color='#4A4A4A'>" + params.title + "</span><br /><span class='thin' style='font-size:22px;line-height: 30px;'>" + params.message + "</span>";
		//Store alert in this.alerts
		this.alerts[sender.name] = new NotificationFx({
			message: image + message,
			effect: this.config.alert_effect,
			ttl: params.timer,
			al_no: "ns-alert"
		});
		//Show alert
		this.alerts[sender.name].show();
		//Add timer to dismiss alert and overlay
		if (params.timer) {
			setTimeout(function() {
				self.hide_alert(sender);
			}, params.timer);
		}

	},
	hide_alert: function(sender) {
		//Dismiss alert and remove from this.alerts
		this.alerts[sender.name].dismiss();
		this.alerts[sender.name] = null;
		//Remove overlay
		var overlay = document.getElementById("overlay");
		overlay.parentNode.removeChild(overlay);
	},
	setPosition: function(pos) {
		//Add css to body depending on the set position for notifications
		var sheet = document.createElement("style");
		if (pos == "center") {sheet.innerHTML = ".ns-box {margin-left: auto; margin-right: auto;text-align: center;}";}
		if (pos == "right") {sheet.innerHTML = ".ns-box {margin-left: auto;text-align: right;}";}
		if (pos == "left") {sheet.innerHTML = ".ns-box {margin-right: auto;text-align: left;}";}
		document.body.appendChild(sheet);

	},
	notificationReceived: function(notification, payload, sender) {
		if (notification === "SHOW_ALERT") {
			if (typeof payload.type === "undefined") { payload.type = "alert"; }
			if (payload.type == "alert") {
				this.show_alert(payload, sender);
			} else if (payload.type = "notification") {
				this.show_notification(payload);
			}
		} else if (notification === "HIDE_ALERT") {
			this.hide_alert(sender);
		}
	},
	start: function() {
		this.alerts = {};
		this.setPosition(this.config.position);
		if (this.config.welcome_message) {
			this.show_notification({title: "MagicMirror Notification", message: this.config.welcome_message});
		}
		Log.info("Starting module: " + this.name);
	}

});
