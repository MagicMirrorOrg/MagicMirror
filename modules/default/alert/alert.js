/* global NotificationFx */

/* Magic Mirror
 * Module: alert
 *
 * By Paul-Vincent Roll https://paulvincentroll.com/
 * MIT Licensed.
 */
Module.register("alert", {
	alerts: {},

	defaults: {
		effect: "slide", // scale|slide|genie|jelly|flip|bouncyflip|exploader
		alert_effect: "jelly", // scale|slide|genie|jelly|flip|bouncyflip|exploader
		display_time: 3500, // time a notification is displayed in seconds
		position: "center",
		welcome_message: false // shown at startup
	},

	getScripts() {
		return ["notificationFx.js"];
	},

	getStyles() {
		return ["font-awesome.css", this.file(`./styles/notificationFx.css`), this.file(`./styles/${this.config.position}.css`)];
	},

	getTranslations() {
		return {
			bg: "translations/bg.json",
			da: "translations/da.json",
			de: "translations/de.json",
			en: "translations/en.json",
			es: "translations/es.json",
			fr: "translations/fr.json",
			hu: "translations/hu.json",
			nl: "translations/nl.json",
			ru: "translations/ru.json"
		};
	},

	getTemplate(type) {
		return `templates/${type}.njk`;
	},

	start() {
		Log.info(`Starting module: ${this.name}`);

		if (this.config.effect === "slide") {
			this.config.effect = `${this.config.effect}-${this.config.position}`;
		}

		if (this.config.welcome_message) {
			const message = this.config.welcome_message === true ? this.translate("welcome") : this.config.welcome_message;
			this.showNotification({ title: this.translate("sysTitle"), message });
		}
	},

	async showNotification(notification) {
		const message = await this.renderMessage("notification", notification);

		new NotificationFx({
			message,
			layout: "growl",
			effect: this.config.effect,
			ttl: notification.timer || this.config.display_time
		}).show();
	},

	showAlert(params, sender) {
		let image = "";
		//Set standard params if not provided by module
		if (typeof params.timer === "undefined") {
			params.timer = null;
		}
		if (typeof params.imageHeight === "undefined") {
			params.imageHeight = "80px";
		}
		if (typeof params.imageUrl === "undefined" && typeof params.imageFA === "undefined") {
			params.imageUrl = null;
		} else if (typeof params.imageFA === "undefined") {
			image = "<img src='" + params.imageUrl.toString() + "' height='" + params.imageHeight.toString() + "' style='margin-bottom: 10px;'/><br />";
		} else if (typeof params.imageUrl === "undefined") {
			image = "<span class='bright " + "fa fa-" + params.imageFA + "' style='margin-bottom: 10px;font-size:" + params.imageHeight.toString() + ";'/></span><br />";
		}
		//Create overlay
		const overlay = document.createElement("div");
		overlay.id = "overlay";
		overlay.innerHTML += '<div class="black_overlay"></div>';
		document.body.insertBefore(overlay, document.body.firstChild);

		//If module already has an open alert close it
		if (this.alerts[sender.name]) {
			this.hideAlert(sender, false);
		}

		//Display title and message only if they are provided in notification parameters
		let message = "";
		if (params.title) {
			message += "<span class='light dimmed medium'>" + params.title + "</span>";
		}
		if (params.message) {
			if (message !== "") {
				message += "<br />";
			}

			message += "<span class='thin bright small'>" + params.message + "</span>";
		}

		//Store alert in this.alerts
		this.alerts[sender.name] = new NotificationFx({
			message: image + message,
			effect: this.config.alert_effect,
			ttl: params.timer,
			onClose: () => this.hideAlert(sender),
			al_no: "ns-alert"
		});

		//Show alert
		this.alerts[sender.name].show();

		//Add timer to dismiss alert and overlay
		if (params.timer) {
			setTimeout(() => {
				this.hideAlert(sender);
			}, params.timer);
		}
	},

	hideAlert(sender, close = true) {
		//Dismiss alert and remove from this.alerts
		if (this.alerts[sender.name]) {
			this.alerts[sender.name].dismiss(close);
			this.alerts[sender.name] = null;
			//Remove overlay
			const overlay = document.getElementById("overlay");
			overlay.parentNode.removeChild(overlay);
		}
	},

	renderMessage(type, data) {
		return new Promise((resolve) => {
			this.nunjucksEnvironment().render(this.getTemplate(type), data, function (err, res) {
				if (err) {
					Log.error("Failed to render alert", err);
				}

				resolve(res);
			});
		});
	},

	notificationReceived(notification, payload, sender) {
		if (notification === "SHOW_ALERT") {
			if (payload.type === "notification") {
				this.showNotification(payload);
			} else {
				this.showAlert(payload, sender);
			}
		} else if (notification === "HIDE_ALERT") {
			this.hideAlert(sender);
		}
	}
});
