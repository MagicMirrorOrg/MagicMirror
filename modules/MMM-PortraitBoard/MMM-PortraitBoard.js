Module.register("MMM-PortraitBoard", {
	defaults: {
		timezone: "Europe/Oslo",
		homeHour: 14,
		homeMinute: 30,
		lat: 59.9139,
		lon: 10.7522,
		weatherUpdateInterval: 30 * 60 * 1000,
		weatherMaxAge: 90 * 60 * 1000,
		departuresMaxAge: 2 * 60 * 1000,
		walkMinutes: { Marienlyst: 5, Majorstuen: 10 },
		maxBusDepartures: 5,
		maxMetroDepartures: 6,
		// When the internet is unreachable, the board shows only the clock and date.
		connectivityUrl: "https://api.entur.io/",
		connectivityInterval: 30 * 1000,
		failuresBeforeOffline: 2
	},

	getStyles() {
		return ["MMM-PortraitBoard.css"];
	},

	start() {
		this.weather = null;
		this.weatherReceivedAt = 0;
		this.departures = [];
		this.departuresReceivedAt = 0;
		this.events = [];
		this.online = true;
		this.sendSocketNotification("PORTRAIT_CONNECTIVITY_START", {
			url: this.config.connectivityUrl,
			interval: this.config.connectivityInterval,
			failuresBeforeOffline: this.config.failuresBeforeOffline
		});
		this.sendSocketNotification("PORTRAIT_WEATHER_START", {
			identifier: this.identifier,
			lat: this.config.lat,
			lon: this.config.lon,
			updateInterval: this.config.weatherUpdateInterval
		});
		this.timer = setInterval(() => this.updateDom(0), 30 * 1000);
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "PORTRAIT_WEATHER" && payload.identifier === this.identifier) {
			this.weather = payload.weather;
			this.weatherReceivedAt = Date.now();
			this.updateDom(0);
		} else if (notification === "PORTRAIT_CONNECTIVITY") {
			this.online = payload.online;
			this.updateDom(0);
		}
	},

	notificationReceived(notification, payload) {
		if (notification === "PORTRAIT_DEPARTURES") {
			this.departures = payload.stops || [];
			this.departuresReceivedAt = payload.receivedAt;
			this.updateDom(0);
		} else if (notification === "CALENDAR_EVENTS") {
			this.events = payload || [];
			this.updateDom(0);
		}
	},

	localParts(date) {
		const parts = new Intl.DateTimeFormat("nb-NO", {
			timeZone: this.config.timezone, weekday: "long", day: "numeric", month: "long",
			hour: "2-digit", minute: "2-digit", hourCycle: "h23"
		}).formatToParts(date);
		return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
	},

	greetingFor(minutes, weekday) {
		if (minutes <= 7 * 60 + 30) return "Tidlig ute i dag? :)";
		if (minutes <= 9 * 60 + 30) return "God morgen";
		if (minutes < 12 * 60) return "God formiddag";
		if (minutes < this.config.homeHour * 60 + this.config.homeMinute) return "Ha en fin dag :)";
		return weekday.toLowerCase() === "fredag" ? "God helg" : "God tur hjem";
	},

	masthead(parts) {
		const minutes = Number(parts.hour) * 60 + Number(parts.minute);
		const header = this.element("header", "portrait-masthead");
		header.appendChild(this.element("time", "portrait-clock", `${parts.hour}:${parts.minute}`));
		header.appendChild(this.element("span", "portrait-date", `${parts.weekday} ${parts.day}. ${parts.month}`));
		header.appendChild(this.element("p", "portrait-header-greeting", this.greetingFor(minutes, parts.weekday)));
		return header;
	},

	element(tag, className, text) {
		const el = document.createElement(tag);
		if (className) el.className = className;
		if (text !== undefined) el.textContent = text;
		return el;
	},

	section(title, aside) {
		const section = this.element("section", "portrait-panel");
		const heading = this.element("div", "portrait-heading");
		heading.appendChild(this.element("h2", "", title));
		if (aside) heading.appendChild(this.element("span", "portrait-aside", aside));
		section.appendChild(heading);
		return section;
	},

	weatherSection(home, now) {
		if (!this.weather || now - this.weatherReceivedAt > this.config.weatherMaxAge) return null;
		const section = this.section("Været");
		section.classList.add("portrait-weather");
		const main = this.element("div", "portrait-weather-main");
		main.appendChild(this.element("span", "portrait-weather-symbol", this.weather.symbol));
		main.appendChild(this.element("strong", "portrait-temperature", `${Math.round(this.weather.temperature)}°`));
		section.appendChild(main);
		const summary = home ? this.weather.homeSummary : this.weather.summary;
		section.appendChild(this.element("p", "portrait-summary", summary));
		return section;
	},

	eventsSection(now) {
		const today = new Intl.DateTimeFormat("en-CA", { timeZone: this.config.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
		const events = this.events.filter((event) => {
			const start = Number(event.startDate);
			const end = Number(event.endDate);
			return Number.isFinite(start) && Number.isFinite(end) && end > now &&
				new Intl.DateTimeFormat("en-CA", { timeZone: this.config.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(start)) === today;
		}).slice(0, 2);
		if (!events.length) return null;
		const section = this.section("Fellesmøter i dag");
		section.classList.add("portrait-events");
		for (const event of events) {
			const row = this.element("div", "portrait-event");
			row.appendChild(this.element("time", "", event.fullDayEvent ? "I dag" : new Intl.DateTimeFormat("nb-NO", { timeZone: this.config.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(Number(event.startDate)))));
			const detail = this.element("div");
			detail.appendChild(this.element("strong", "", event.title));
			if (event.location) detail.appendChild(this.element("span", "", event.location));
			row.appendChild(detail);
			section.appendChild(row);
		}
		return section;
	},

	departuresFor(stopName, mode, now, limit) {
		const walk = this.config.walkMinutes[stopName] || 0;
		return this.departures
			.filter((stop) => stop.name.toLowerCase().includes(stopName.toLowerCase()))
			.flatMap((stop) => stop.departures)
			.filter((dep) => dep.mode === mode && (new Date(dep.expectedTime).getTime() - now) / 60000 >= walk)
			.sort((a, b) => new Date(a.expectedTime) - new Date(b.expectedTime))
			.slice(0, limit);
	},

	departureGroup(title, stopName, mode, now) {
		const group = this.element("div", "portrait-departure-group");
		const heading = this.element("div", "portrait-group-header");
		heading.appendChild(this.element("h3", "portrait-group-heading", `${title} · ${stopName}`));
		if (mode === "metro") heading.appendChild(this.element("span", "portrait-track-heading", "Spor"));
		group.appendChild(heading);
		const limit = mode === "metro" ? this.config.maxMetroDepartures : this.config.maxBusDepartures;
		const reachable = this.departuresFor(stopName, mode, now, limit);
		if (!reachable.length) group.appendChild(this.element("p", "portrait-unavailable", "Ingen avganger innen rekkevidde"));
		for (const dep of reachable) {
			const row = this.element("div", `portrait-departure${mode === "metro" ? " portrait-departure-metro" : ""}`);
			const metroLine = mode === "metro" && ["1", "2", "3", "4", "5"].includes(String(dep.line)) ? ` portrait-metro-line-${dep.line}` : "";
			row.appendChild(this.element("span", `portrait-badge portrait-${mode}${metroLine}`, dep.line));
			row.appendChild(this.element("strong", "portrait-destination", dep.destination));
			row.appendChild(this.element("span", "portrait-minutes", `${Math.max(0, Math.ceil((new Date(dep.expectedTime) - now) / 60000))} min`));
			if (mode === "metro") row.appendChild(this.element("span", "portrait-track", dep.track || "–"));
			group.appendChild(row);
		}
		return group;
	},

	departuresSection(now) {
		const section = this.section("Avganger");
		section.classList.add("portrait-departures");
		if (now - this.departuresReceivedAt > this.config.departuresMaxAge) {
			section.appendChild(this.element("p", "portrait-unavailable", "Avganger ikke tilgjengelige nå"));
			return section;
		}
		section.appendChild(this.departureGroup("Buss", "Marienlyst", "bus", now));
		section.appendChild(this.departureGroup("T-bane", "Majorstuen", "metro", now));
		return section;
	},

	messagesPreview() {
		const preview = this.element("main", "portrait-comparison");
		preview.appendChild(this.element("h1", "portrait-comparison-title", "Hilsener gjennom dagen"));
		preview.appendChild(this.element("p", "portrait-comparison-note", "Utsnitt av dashbordet · eksempelvær · klokkeslett i Europe/Oslo"));
		const grid = this.element("div", "portrait-comparison-grid");
		const cases = [
			["00:00–07:30", "2026-10-21T07:30:00+02:00"],
			["07:31–09:30", "2026-10-21T09:00:00+02:00"],
			["09:31–11:59", "2026-10-21T10:30:00+02:00"],
			["12:00–14:29", "2026-10-21T13:00:00+02:00"],
			["14:30–23:59 · øvrige dager", "2026-10-21T15:00:00+02:00"],
			["14:30–23:59 · fredag", "2026-10-23T15:00:00+02:00"]
		];
		for (const [label, date] of cases) {
			const card = this.element("div", "portrait-comparison-card");
			card.appendChild(this.element("h2", "portrait-comparison-label", label));
			const parts = this.localParts(new Date(date));
			const home = Number(parts.hour) * 60 + Number(parts.minute) >= this.config.homeHour * 60 + this.config.homeMinute;
			const board = this.element("div", `portrait-board ${home ? "portrait-home" : "portrait-workday"}`);
			board.appendChild(this.masthead(parts));
			const body = this.element("div", "portrait-body");
			const weather = this.section("Været");
			weather.classList.add("portrait-weather");
			const main = this.element("div", "portrait-weather-main");
			main.appendChild(this.element("span", "portrait-weather-symbol", "☁"));
			main.appendChild(this.element("strong", "portrait-temperature", "12°"));
			weather.appendChild(main);
			weather.appendChild(this.element("p", "portrait-summary", home ? "Opphold på vei hjem" : "Opphold utover dagen"));
			body.appendChild(weather);
			board.appendChild(body);
			card.appendChild(board);
			grid.appendChild(card);
		}
		preview.appendChild(grid);
		return preview;
	},

	offlineBoard(parts) {
		const board = this.element("main", "portrait-board portrait-offline");
		board.appendChild(this.element("time", "portrait-clock", `${parts.hour}:${parts.minute}`));
		board.appendChild(this.element("span", "portrait-date", `${parts.weekday} ${parts.day}. ${parts.month}`));
		board.appendChild(this.element("span", "portrait-offline-note", "Frakoblet"));
		return board;
	},

	getDom() {
		if (new URLSearchParams(window.location.search).get("preview") === "messages") return this.messagesPreview();
		const now = Date.now();
		// Preview only changes the displayed clock/date and view; live data is still filtered against real time.
		const preview = new URLSearchParams(window.location.search).get("preview");
		if (!this.online || preview === "offline") return this.offlineBoard(this.localParts(new Date(now)));
		const parts = this.localParts(preview === "wednesday" ? new Date("2026-10-21T15:00:00+02:00") : new Date(now));
		if (preview === "morning") {
			parts.hour = "09";
			parts.minute = "00";
		}
		const minutes = Number(parts.hour) * 60 + Number(parts.minute);
		const home = minutes >= this.config.homeHour * 60 + this.config.homeMinute;
		const board = this.element("main", "portrait-board portrait-home");
		board.appendChild(this.masthead(parts));
		const body = this.element("div", "portrait-body");
		const weather = this.weatherSection(home, now);
		if (weather) body.appendChild(weather);
		body.appendChild(this.departuresSection(now));
		board.appendChild(body);
		return board;
	}
});
