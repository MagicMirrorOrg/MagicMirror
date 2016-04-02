/* global Module */

/* Magic Mirror
 * Module: alert
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

Module.register('alert',{
	defaults: {
		// layout type: growl|attached|bar
		layout: "growl",
		// effects for the specified layout:
		// for growl layout: scale|slide|genie|jelly
		// for attached layout: flip|bouncyflip
		// for bar layout: slidetop|exploader
		effect: "slide",
		//shown at startup
		welcome_message: "Welcome, start was successfull!"
	},
	getScripts: function() {
		return ["classie.js", "modernizr.custom.js", 'notificationFx.js', 'sweetalert.js'];
	},
	getStyles: function() {
		return ['ns-style-growl.css', 'ns-style-bar.css', 'ns-style-attached.css', 'ns-default.css', 'sweetalert.css'];
	},
	show_notification: function (message) {
		//If another alert is in view remove it first
		if (this.alert){
		this.alert.dismiss()
		}
		this.alert = new NotificationFx({
			message : message,
			layout : this.config.layout,
			effect : this.config.effect,
			type : 'notice', 
			ttl: 6000
		});
		this.alert.show()
	},
	show_alert: function (params) {
		if (typeof params["type"] === 'undefined') { params["type"] = null; }
		if (typeof params["imageUrl"] === 'undefined') { params["imageUrl"] = null; }
		if (typeof params["imageSize"] === 'undefined') { params["imageSize"] = null; }
		if (typeof params["timer"] === 'undefined') { params["timer"] = null; }
		swal({
			title: params["title"], 
			imageUrl: params["imageUrl"], 
			imageSize: params["imageSize"],
			type: params["type"],
			text: params["message"],
			timer: params["timer"],
			html: true,
			showConfirmButton: false 
			});
	},
	hide_alert: function () {
		swal.close()
	},
	notificationReceived: function(notification, payload, sender) {
		if (notification === 'SHOW_NOTIFICATION') {
			this.show_notification(payload)
		}
		else if (notification === 'SHOW_ALERT') {
			this.show_alert(payload)
		}
		else if (notification === 'HIDE_ALERT') {
			this.hide_alert()
		}
	},
	start: function() {
		this.show_notification(this.config.welcome_message)
		Log.info('Starting module: ' + this.name);
	}

});