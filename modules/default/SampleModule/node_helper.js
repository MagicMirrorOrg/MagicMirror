var NodeHelper = require("node_helper");

// add require of other javascripot components here
// var xxx = require('yyy') here

module.exports = NodeHelper.create({

	init(){
		console.log("init module helper SampleModule");
	},

	start() {
		console.log(`Starting module helper: ${this.name}`);
	},

	stop(){
		console.log(`Stopping module helper: ${this.name}`);
	},

	// handle messages from our module// each notification indicates a different messages
	// payload is a data structure that is different per message.. up to you to design this
	socketNotificationReceived(notification, payload) {
		console.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		// if config message from module
		if (notification === "CONFIG") {
			// save payload config info
			this.config=payload
		}
		else if(notification === "????2") {
		}

	},

});