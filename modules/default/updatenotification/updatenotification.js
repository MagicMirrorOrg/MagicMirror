/* MagicMirror²
 * Module: UpdateNotification
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("updatenotification", {
	defaults: {
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		refreshInterval: 24 * 60 * 60 * 1000, // one day
		ignoreModules: [],
		sendUpdatesNotifications: false,
		updates: [
			// array of module update commands
			{
				// with embed npm script
				"MMM-Test": "npm run update"
			},
			{
				// with "complex" process
				"MMM-OtherSample": "rm -rf package-lock.json && git reset --hard && git pull && npm install"
			},
			{
				// with git pull && npm install
				"MMM-OtherSample2": "git pull && npm install"
			},
			{
				// with a simple git pull
				"MMM-OtherSample3": "git pull"
			}
		],
		updateTimeout: 2 * 60 * 1000, // max update duration
		updateAutorestart: false // autoRestart MM when update done ?
	},

	suspended: false,
	moduleList: {},
	needRestart: false,
	updates: {},

	start() {
		Log.info(`Starting module: ${this.name}`);
		this.addFilters();
		setInterval(() => {
			this.moduleList = {};
			this.updateDom(2);
		}, this.config.refreshInterval);
	},

	suspend() {
		this.suspended = true;
	},

	resume() {
		this.suspended = false;
		this.updateDom(2);
	},

	notificationReceived(notification) {
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

	socketNotificationReceived(notification, payload) {
		switch (notification) {
			case "STATUS":
				this.updateUI(payload);
				break;
			case "UPDATES":
				this.sendNotification("UPDATES", payload);
				break;
			case "UPDATED":
				this.updatesNotifier(payload);
				break;
			case "UPDATE_ERROR":
				this.updatesNotifier(payload, false);
				break;
			case "NEED_RESTART":
				this.needRestart = true;
				this.updateDom(2);
				break;
		}
	},

	getStyles() {
		return [`${this.name}.css`];
	},

	getTemplate() {
		return `${this.name}.njk`;
	},

	getTemplateData() {
		return { moduleList: this.moduleList, updatesList: this.updates, suspended: this.suspended, needRestart: this.needRestart };
	},

	updateUI(payload) {
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

	addFilters() {
		this.nunjucksEnvironment().addFilter("diffLink", (text, status) => {
			if (status.module !== "MagicMirror") {
				return text;
			}

			const localRef = status.hash;
			const remoteRef = status.tracking.replace(/.*\//, "");
			return `<a href="https://github.com/MichMich/MagicMirror/compare/${localRef}...${remoteRef}" class="xsmall dimmed difflink" target="_blank">${text}</a>`;
		});
	},

	updatesNotifier(payload, done = true) {
		this.updates[payload] = {
			name: payload,
			done: done
		};
		this.updateDom(2);
	}
});
