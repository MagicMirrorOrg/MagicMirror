Module.register("MMM-RuterDepartures", {
	defaults: {
		lat: 59.932267,
		lon: 10.724083,
		maxStops: 3,
		maxDepartures: 6,
		updateInterval: 30 * 1000,
		walkMinutes: {},
		defaultWalkMinutes: 0,
	},

	getStyles() {
		return ["MMM-RuterDepartures.css"];
	},

	start() {
		this.stops = [];
		this.sendSocketNotification("RUTER_GET_DEPARTURES", {
			...this.config,
			identifier: this.identifier,
		});
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "RUTER_DEPARTURES" && payload.identifier === this.identifier) {
			this.stops = payload.stops;
			this.sendNotification("PORTRAIT_DEPARTURES", { stops: this.stops, receivedAt: Date.now() });
			this.updateDom();
		}
	},

	getDom() {
		const wrapper = document.createElement("div");

		if (!this.stops.length) {
			wrapper.className = "dimmed small";
			wrapper.textContent = "Laster avganger…";
			return wrapper;
		}

		for (const stop of this.stops) {
			const walkMins = this.walkMinutesFor(stop.name);
			const now = new Date();

			const reachable = stop.departures.filter((dep) => {
				const mins = Math.round((new Date(dep.expectedTime) - now) / 60000);
				return mins >= walkMins;
			}).slice(0, this.config.maxDepartures);

			const section = document.createElement("div");
			section.className = "ruter-stop";

			const header = document.createElement("div");
			header.className = "ruter-stop-name dimmed xsmall";
			header.textContent = stop.name;
			section.appendChild(header);

			if (!reachable.length) {
				const empty = document.createElement("div");
				empty.className = "dimmed xsmall";
				empty.textContent = "Ingen avganger innen rekkevidde";
				section.appendChild(empty);
			} else {
				const list = document.createElement("div");
				list.className = "ruter-departures small";

				for (const dep of reachable) {
					const mins = Math.round((new Date(dep.expectedTime) - now) / 60000);
					const row = document.createElement("div");
					row.className = "ruter-row";
					row.innerHTML = `
						<span class="ruter-line">${dep.line}</span>
						<span class="ruter-destination">${dep.destination}</span>
						<span class="ruter-time ${dep.realtime ? "realtime" : ""}">${mins} min</span>
					`;
					list.appendChild(row);
				}

				section.appendChild(list);
			}

			wrapper.appendChild(section);
		}

		return wrapper;
	},

	walkMinutesFor(stopName) {
		const map = this.config.walkMinutes;
		for (const key of Object.keys(map)) {
			if (stopName.toLowerCase().includes(key.toLowerCase())) {
				return map[key];
			}
		}
		return this.config.defaultWalkMinutes;
	},
});
