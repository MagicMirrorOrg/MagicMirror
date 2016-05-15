/* global Module */

/* Magic Mirror
 * Module: MMM-Wunderlist
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

Module.register("MMM-Wunderlist", {

 defaults: {
	maximumEntries: 10,
	lists: ["inbox"],
	interval: 60,
	fade: true,
	fadePoint: 0.25
 },

 // Override socket notification handler.
 socketNotificationReceived: function(notification, payload) {
	if (notification === "TASKS") {
	 this.tasks = payload
	 this.updateDom(3000);
	} else if (notification === "STARTED") {
	 console.log(notification);
	 this.sendSocketNotification("addLists", this.config.lists);
	}
 },

 start: function() {
	this.tasks = [];
	this.sendSocketNotification("CONFIG", this.config);
	this.sendSocketNotification("CONNECTED");
	Log.info("Starting module: " + this.name);
 },

 getTodos: function() {
	var tasksShown = [];

	for (var i = 0; i < this.config.lists.length; i++) {
	 if (typeof this.tasks[this.config.lists[i]] != "undefined") {
		var list = this.tasks[this.config.lists[i]];

		for (var todo in list) {
		 tasksShown.push(list[todo]);

		}
	 }
	}
	return tasksShown.slice(0, this.config.maximumEntries);

 },
 getDom: function() {
	var wrapper = document.createElement("table");
	wrapper.className = "normal small light";

	var todos = this.getTodos();


	for (var i = 0; i < todos.length; i++) {
	 var titleWrapper = document.createElement("tr");
	 titleWrapper.innerHTML = todos[i];
	 titleWrapper.className = "title bright";
	 wrapper.appendChild(titleWrapper);

	 // Create fade effect by MichMich (MIT)
	 if (this.config.fade && this.config.fadePoint < 1) {
		if (this.config.fadePoint < 0) {
		 this.config.fadePoint = 0;
		}
		var startingPoint = todos.length * this.config.fadePoint;
		var steps = todos.length - startingPoint;
		if (i >= startingPoint) {
		 var currentStep = i - startingPoint;
		 titleWrapper.style.opacity = 1 - (1 / steps * currentStep);
		}
	 }
	 // End Create fade effect by MichMich (MIT)
	}

	return wrapper;
 }

});