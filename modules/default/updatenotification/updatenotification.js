Module.register("updatenotification", {
	defaults: {
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		refreshInterval: 24 * 60 * 60 * 1000, // one day
		ignoreModules: [],
		sendUpdatesNotifications: false,
		updates: [],
		updateTimeout: 2 * 60 * 1000, // max update duration
		updateAutorestart: false // autoRestart MM when update done ?
	},

	suspended: false,
	moduleList: {},
	needRestart: false,
	updates: [],

	start () {
		Log.info(`Starting module: ${this.name}`);
		this.addFilters();
		setInterval(() => {
			this.moduleList = {};
			this.updateDom(2);
		}, this.config.refreshInterval);
	},

	suspend () {
		this.suspended = true;
	},

	resume () {
		this.suspended = false;
		this.updateDom(2);
	},

	notificationReceived (notification) {
		switch (notification) {
			case "DOM_OBJECTS_CREATED":
				this.sendSocketNotification("CONFIG", this.config);
				this.sendSocketNotification("MODULES", Object.keys(Module.definitions));
				break;
			case "SCAN_UPDATES":
				this.sendSocketNotification("SCAN_UPDATES");
				break;
		}
	},

	socketNotificationReceived (notification, payload) {
		switch (notification) {
			case "REPO_STATUS":
				this.updateUI(payload);
				break;
			case "UPDATES":
				this.sendNotification("UPDATES", payload);
				break;
			case "UPDATE_STATUS":
				this.updatesNotifier(payload);
				break;
		}
	},

	getStyles () {
		return [`${this.name}.css`];
	},

	getTemplate () {
		return `${this.name}.njk`;
	},

	getTemplateData () {
		return { moduleList: this.moduleList, updatesList: this.updates, suspended: this.suspended, needRestart: this.needRestart };
	},

	updateUI (payload) {
		if (payload && payload.behind > 0) {
			// if we haven't seen info for this module
			if (this.moduleList[payload.module] === undefined) {
				// save it
				this.moduleList[payload.module] = payload;
				this.updateDom(2);
			}
		} else if (payload && payload.behind === 0) {
			// if the module WAS in the list, but shouldn't be
			if (this.moduleList[payload.module] !== undefined) {
				// remove it
				delete this.moduleList[payload.module];
				this.updateDom(2);
			}
		}
	},

	addFilters () {
		this.nunjucksEnvironment().addFilter("diffLink", (text, status) => {
			if (status.module !== "MagicMirror") {
				return text;
			}

			const localRef = status.hash;
			const remoteRef = status.tracking.replace(/.*\//, "");
			return `<a href="https://github.com/MagicMirrorOrg/MagicMirror/compare/${localRef}...${remoteRef}" class="xsmall dimmed difflink" target="_blank">${text}</a>`;
		});
	},

	updatesNotifier (payload, done = true) {
		if (this.updates[payload.name] === undefined) {
			this.updates[payload.name] = {
				name: payload.name,
				done: done
			};

			if (payload.error) {
				this.sendSocketNotification("UPDATE_ERROR", payload.name);
				this.updates[payload.name].done = false;
			} else {
				if (payload.updated) {
					delete this.moduleList[payload.name];
					this.updates[payload.name].done = true;
				}
				if (payload.needRestart) {
					this.needRestart = true;
				}
			}

			this.updateDom(2);
		}
	}
});
