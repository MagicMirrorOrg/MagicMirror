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
		ignoreModules: []
	},

	suspended: false,
	moduleList: {},

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
		if (notification === "DOM_OBJECTS_CREATED") {
			this.sendSocketNotification("CONFIG", this.config);
			this.sendSocketNotification("MODULES", Object.keys(Module.definitions));
		}
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "STATUS") {
			this.updateUI(payload);
		}
	},

	getStyles() {
		return [`${this.name}.css`];
	},

	getTemplate() {
		return `${this.name}.njk`;
	},

	getTemplateData() {
		return { moduleList: this.moduleList, suspended: this.suspended };
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
			if (status.module !== "default") {
				return text;
			}

			const localRef = status.hash;
			const remoteRef = status.tracking.replace(/.*\//, "");
			return `<a href="https://github.com/MichMich/MagicMirror/compare/${localRef}...${remoteRef}" class="xsmall dimmed difflink" target="_blank">${text}</a>`;
		});
	}
});
