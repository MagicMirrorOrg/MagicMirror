/* global NotificationFx */

Module.register("alert", {
	alerts: {},

	defaults: {
		effect: "slide", // scale|slide|genie|jelly|flip|bouncyflip|exploader
		alert_effect: "jelly", // scale|slide|genie|jelly|flip|bouncyflip|exploader
		display_time: 3500, // time a notification is displayed in seconds
		position: "center",
		welcome_message: false // shown at startup
	},

	getScripts () {
		return ["notificationFx.js"];
	},

	getStyles () {
		return ["font-awesome.css", this.file("./styles/notificationFx.css"), this.file(`./styles/${this.config.position}.css`)];
	},

	getTranslations () {
		return {
			bg: "translations/bg.json",
			da: "translations/da.json",
			de: "translations/de.json",
			en: "translations/en.json",
			eo: "translations/eo.json",
			es: "translations/es.json",
			fr: "translations/fr.json",
			hu: "translations/hu.json",
			nl: "translations/nl.json",
			ru: "translations/ru.json",
			th: "translations/th.json"
		};
	},

	getTemplate (type) {
		return `templates/${type}.njk`;
	},

	async start () {
		Log.info(`Starting module: ${this.name}`);

		if (this.config.effect === "slide") {
			this.config.effect = `${this.config.effect}-${this.config.position}`;
		}

		if (this.config.welcome_message) {
			const message = this.config.welcome_message === true ? this.translate("welcome") : this.config.welcome_message;
			await this.showNotification({ title: this.translate("sysTitle"), message });
		}
	},

	notificationReceived (notification, payload, sender) {
		if (notification === "SHOW_ALERT") {
			if (payload.type === "notification") {
				this.showNotification(payload);
			} else {
				this.showAlert(payload, sender);
			}
		} else if (notification === "HIDE_ALERT") {
			this.hideAlert(sender);
		}
	},

	async showNotification (notification) {
		const message = await this.renderMessage(notification.templateName || "notification", notification);

		new NotificationFx({
			message,
			layout: "growl",
			effect: this.config.effect,
			ttl: notification.timer || this.config.display_time
		}).show();
	},

	async showAlert (alert, sender) {
		// If module already has an open alert close it
		if (this.alerts[sender.name]) {
			this.hideAlert(sender, false);
		}

		// Add overlay
		if (!Object.keys(this.alerts).length) {
			this.toggleBlur(true);
		}

		const message = await this.renderMessage(alert.templateName || "alert", alert);

		// Store alert in this.alerts
		this.alerts[sender.name] = new NotificationFx({
			message,
			effect: this.config.alert_effect,
			ttl: alert.timer,
			onClose: () => this.hideAlert(sender),
			al_no: "ns-alert"
		});

		// Show alert
		this.alerts[sender.name].show();

		// Add timer to dismiss alert and overlay
		if (alert.timer) {
			setTimeout(() => {
				this.hideAlert(sender);
			}, alert.timer);
		}
	},

	hideAlert (sender, close = true) {
		// Dismiss alert and remove from this.alerts
		if (this.alerts[sender.name]) {
			this.alerts[sender.name].dismiss(close);
			delete this.alerts[sender.name];
			// Remove overlay
			if (!Object.keys(this.alerts).length) {
				this.toggleBlur(false);
			}
		}
	},

	renderMessage (type, data) {
		return new Promise((resolve) => {
			this.nunjucksEnvironment().render(this.getTemplate(type), data, function (err, res) {
				if (err) {
					Log.error("Failed to render alert", err);
				}

				resolve(res);
			});
		});
	},

	toggleBlur (add = false) {
		const method = add ? "add" : "remove";
		const modules = document.querySelectorAll(".module");
		for (const module of modules) {
			module.classList[method]("alert-blur");
		}
	}
});
