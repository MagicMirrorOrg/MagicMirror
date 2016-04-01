/* global Module */

/* Magic Mirror
 * Module: alert
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

Module.register('alert',{
	defaults: {
		// layout type: growl|attached|bar|other
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
		return ["classie.js", "modernizr.custom.js", 'notificationFx.js'];
	},
	getStyles: function() {
		return ['ns-style-growl.css', 'ns-style-bar.css', 'ns-style-attached.css', 'ns-default.css'];
	},
	show_alert: function (message) {
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
	notificationReceived: function(notification, payload, sender) {
		if (notification === 'SHOW_ALERT') {
			console.log(this.config.layout);
			this.show_alert(payload.message)
		}
	},
	start: function() {
		// create the notification
		this.show_alert(this.config.welcome_message)
		Log.info('Starting module: ' + this.name);
	}

});