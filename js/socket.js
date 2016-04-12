/* exported Log */

/* Magic Mirror
 * Socket Connection
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var MMSocket = function(moduleName) {

	var self = this;

	if (typeof moduleName !== "string") {
		throw new Error("Please set the module name for the MMSocket.");
	}

	self.moduleName = moduleName;

	self.socket = io("http://localhost:8080");
	self.socket.on("notification", function(data) {
		MM.sendNotification(data.notification, data.payload, Socket);
	});

	return {
		sendMessage: function(notification, payload, sender) {
			Log.log("Send socket message: " + notification);
			self.socket.emit("notification", {
				notification: notification,
				sender: sender,
				payload: payload
			});
		}
	};
};
