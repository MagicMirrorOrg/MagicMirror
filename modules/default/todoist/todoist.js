/* Magic Mirror
 * Module: Todoist
 *
 * By alexan_b
 * MIT Licensed.
 */

Module.register("todoist", {
	defaults: {
		error: undefined,
		token: undefined,
		refreshRate: 10000,
		dueTasks: [],
		hasMadeQuery: false
	},

	start: function () {
		Log.info("Starting module: " + this.name);
		this.updateTodolist();
	},

	updateTodolist: function () {
		if (this.config.token === undefined) {
			this.config.error = "token not set";
			return;
		}

		var url = "https://api.todoist.com/rest/v1/tasks";
		var self = this;

		var today = new Date();
		let dd = String(today.getDate()).padStart(2, "0");
		let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
		let yyyy = today.getFullYear();

		today = yyyy + "-" + mm + "-" + dd;

		let previousDueTask = self.config.dueTasks;
		self.config.dueTasks = [];
		let previousError = self.config.error;

		var todoistRequest = new XMLHttpRequest();
		todoistRequest.open("GET", url, true);
		todoistRequest.setRequestHeader("Authorization", "Bearer " + this.config.token);
		todoistRequest.onreadystatechange = function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					var orderedTasks = JSON.parse(this.response);
					orderedTasks.sort(function (a, b) {
						if (a["order"] < b["order"]) return -1;
						if (a["order"] > b["order"]) return 1;
						return 0;
					});
					for (const task of orderedTasks) {
						if (task["due"]["date"] == today) self.config.dueTasks.push(task["content"]);
					}
					if (JSON.stringify(self.config.dueTasks) !== JSON.stringify(previousDueTask)) {
						self.updateDom(1000);
					}
				} else {
					self.config.error = "Fail to retrieve tasks: error " + this.status;
					if (self.config.error !== previousError) {
						self.updateDom(1000);
					}
				}
			}
			if (self.config.hasMadeQuery === false) {
				self.config.hasMadeQuery = true;
				self.updateDom(1000);
			}
			self.scheduleUpdate();
		};
		todoistRequest.send();
	},

	scheduleUpdate: function () {
		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function () {
			self.updateTodolist();
		}, this.config.refreshRate);
	},

	getStyles: function () {
		return ["todoist.css"];
	},

	getTemplate: function () {
		return "todoist.njk";
	},

	getTemplateData: function () {
		return this.config;
	}
});
