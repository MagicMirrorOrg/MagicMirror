/* MagicMirror² Module: MMM-FamilyAgenda
 * A compact family agenda built on top of the standard MagicMirror `calendar` module:
 * upcoming events grouped by day, each with a semantic emoji, the participants (person
 * avatars derived from the calendar name) and — optionally — the weather at the event's
 * location. It does not fetch calendars itself; it listens to `CALENDAR_EVENTS`.
 *
 * By Andreas Göpfert — MIT Licensed.
 */
Module.register("MMM-FamilyAgenda", {
	defaults: {
		title: "Agenda",
		columnLabels: { people: "People", weather: "Weather" },
		maximumNumberOfDays: 30,
		maximumEventDays: 10,
		maximumEntries: 18,
		locale: null,
		// Person avatars, keyed by calendar name (calendarName from the calendar module).
		people: {},                 // e.g. { "Alice": { emoji:"👩", color:"#f43f5e" } }
		calendarAliases: {},        // map a calendarName to a person, e.g. { "Alice Sport": "Alice" }
		holidayOwner: "Holiday",
		defaultOwner: "Family",
		// Optional weather-per-event (needs an OpenWeather key). Geocoding via OpenStreetMap Nominatim.
		showWeather: false,
		appid: "",
		// Ongoing multi-day events (holidays, trips, a visiting relative) are pinned on top as a
		// "running … until <end>" band instead of being anchored to their past start date.
		ongoingBand: true,
		labels: { today: "Today", tomorrow: "Tomorrow", dayAfterTomorrow: null, allDay: "all day", running: "now", until: "until" }
	},

	getStyles() { return ["MMM-FamilyAgenda.css"]; },

	start() { this.events = []; this.weatherByKey = {}; },

	keyFor(event) {
		return `${Number(event.startDate)}|${String(event.title || "").trim().toLowerCase()}`;
	},

	notificationReceived(notification, payload) {
		if (notification !== "CALENDAR_EVENTS") return;
		this.events = Array.isArray(payload) ? payload : [];
		if (this.config.showWeather && this.config.appid) this.requestWeather();
		this.updateDom(this.config.animationSpeed);
	},

	requestWeather() {
		const now = Date.now(), horizon = now + 5 * 86400000, seen = new Set(), req = [];
		for (const e of this.events) {
			const loc = String(e.location || "").trim();
			const start = Number(e.startDate);
			if (!loc || !start || start < now - 3600000 || start > horizon) continue;
			const key = this.keyFor(e);
			if (seen.has(key)) continue;
			seen.add(key);
			req.push({ key, location: loc, startDate: start });
		}
		if (req.length) this.sendSocketNotification("FA_WEATHER_REQ", { appid: this.config.appid, events: req });
	},

	socketNotificationReceived(n, p) {
		if (n === "FA_WEATHER_DATA") { this.weatherByKey = Object.assign(this.weatherByKey, p || {}); this.updateDom(this.config.animationSpeed); }
	},

	personMeta(name) { return this.config.people[name] || { emoji: "🏠", color: "#9aa4ac" }; },

	ownerFor(event) {
		const name = String(event.calendarName || "").trim();
		if (/holiday|ferien|vacation/i.test(name) || /holiday|ferien|vacation/i.test(event.title || "")) return this.config.holidayOwner;
		return this.config.calendarAliases[name] || name || this.config.defaultOwner;
	},

	emojiFor(event) {
		const text = String(event.title || "").toLowerCase();
		const rules = [
			[/birthday|geburtstag/, "🎂"],
			[/trash|garbage|recycl|müll|muell|papier/, "🗑️"],
			[/holiday|vacation|ferien|urlaub/, "🏖️"],
			[/football|soccer|fußball|fussball/, "⚽"],
			[/run |lauf|sport|training|swim|schwim|gym|fitness|triathlon/, "🏃"],
			[/school|klasse|einschulung|graduation/, "🎓"],
			[/kita|kindergarten|nursery|daycare/, "🧸"],
			[/doctor|arzt|dentist|zahnarzt|clinic|klinik|therapy|therapie/, "🩺"],
			[/concert|music|musik|festival/, "🎵"],
			[/dinner|lunch|restaurant|grill|party|feier/, "🍽️"],
			[/travel|flight|flug|airport|hotel|reise/, "✈️"],
			[/meeting|call|webinar|stream|work/, "💻"]
		];
		for (const [pattern, emoji] of rules) if (pattern.test(text)) return emoji;
		return this.personMeta(this.ownerFor(event)).emoji;
	},

	// Compact inline weather icon (original MIT SVGs)
	wxIcon(key) {
		const S = {
			sun: `<circle cx="12" cy="12" r="5" fill="#ffb43a"/><g stroke="#ffb43a" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></g>`,
			cloud: `<path d="M7 18a4 4 0 0 1 0-8 6 6 0 0 1 11 2 3.5 3.5 0 0 1 0 6z" fill="#c3ccda"/>`,
			rain: `<path d="M7 15a4 4 0 0 1 0-8 6 6 0 0 1 11 2 3.5 3.5 0 0 1 0 6z" fill="#c3ccda"/><g stroke="#4aa3e0" stroke-width="2" stroke-linecap="round"><path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3"/></g>`,
			storm: `<path d="M7 15a4 4 0 0 1 0-8 6 6 0 0 1 11 2 3.5 3.5 0 0 1 0 6z" fill="#c3ccda"/><path d="M12 15l-3 4h2l-1 4 4-5h-2z" fill="#ffd23f"/>`,
			snow: `<path d="M7 15a4 4 0 0 1 0-8 6 6 0 0 1 11 2 3.5 3.5 0 0 1 0 6z" fill="#c3ccda"/><g fill="#eaf2ff"><circle cx="9" cy="19" r="1.3"/><circle cx="13" cy="20" r="1.3"/><circle cx="16" cy="19" r="1.3"/></g>`,
			fog: `<g stroke="#c3ccda" stroke-width="2" stroke-linecap="round"><path d="M5 9h14M5 13h14M7 17h10"/></g>`
		};
		return `<svg viewBox="0 0 24 24" width="26" height="26">${S[key] || S.cloud}</svg>`;
	},

	getDom() {
		const root = document.createElement("section");
		root.className = "family-agenda";
		root.innerHTML = `<header class="fa-head"><span class="fa-h-title">${this.config.title}</span><span class="fa-h-per">${this.config.columnLabels.people}</span><span class="fa-h-wx">${this.config.showWeather ? this.config.columnLabels.weather : ""}</span></header>`;

		const now = new Date();
		const horizon = new Date(now.getTime() + this.config.maximumNumberOfDays * 86400000);
		const rawEvents = this.events
			.filter((e) => Number(e.endDate || e.startDate) >= now.getTime())
			.filter((e) => Number(e.startDate) <= horizon.getTime())
			.sort((a, b) => Number(a.startDate) - Number(b.startDate));
		const merged = new Map();
		for (const event of rawEvents) {
			const key = [Number(event.startDate), Number(event.endDate), String(event.title || "").trim().toLowerCase()].join("|");
			if (!merged.has(key)) merged.set(key, { ...event, owners: [] });
			const owner = this.ownerFor(event);
			if (!merged.get(key).owners.some((o) => o.name === owner)) merged.get(key).owners.push({ name: owner });
		}
		const allEvents = [...merged.values()];

		// Split off ongoing multi-day events (started before today, still running) so they show
		// in a pinned band with their end date instead of at their — now past — start date.
		const ongoing = [];
		const events = [];
		if (this.config.ongoingBand) {
			const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
			for (const event of allEvents) {
				const s = Number(event.startDate);
				const e = Number(event.endDate || event.startDate);
				if (e - s > 36 * 3600 * 1000 && s < todayStart.getTime() && e > now.getTime()) ongoing.push(event);
				else events.push(event);
			}
			ongoing.sort((a, b) => Number(a.endDate) - Number(b.endDate));
		} else {
			events.push(...allEvents);
		}

		if (ongoing.length) {
			const band = document.createElement("div");
			band.className = "fa-current";
			for (const event of ongoing) band.appendChild(this.ongoingRow(event));
			root.appendChild(band);
		}

		const groups = [];
		let shown = 0;
		for (const event of events) {
			if (shown >= this.config.maximumEntries) break;
			const key = this.dayKey(Number(event.startDate));
			let group = groups.find((g) => g.key === key);
			if (!group) {
				if (groups.length >= this.config.maximumEventDays) continue;
				group = { key, date: new Date(Number(event.startDate)), events: [] };
				groups.push(group);
			}
			group.events.push(event); shown++;
		}

		if (!groups.length && !ongoing.length) {
			const empty = document.createElement("div");
			empty.className = "fa-empty";
			empty.textContent = "No upcoming events";
			root.appendChild(empty);
			return root;
		}

		for (const group of groups) {
			const day = document.createElement("div");
			day.className = "fa-day";
			const dayHead = document.createElement("div");
			dayHead.className = "fa-dayhead";
			dayHead.innerHTML = `<strong>${this.relativeDay(group.date)}</strong><span>${group.date.toLocaleDateString(this.config.locale || undefined, { weekday: "short", day: "2-digit", month: "short" })}</span>`;
			day.appendChild(dayHead);
			for (const event of group.events) day.appendChild(this.eventRow(event));
			root.appendChild(day);
		}
		return root;
	},

	eventRow(event) {
		const row = document.createElement("div");
		row.className = "fa-event";
		row.style.setProperty("--calendar-color", event.color || "#aeb6bf");

		const when = document.createElement("time");
		when.textContent = event.fullDayEvent
			? this.config.labels.allDay
			: new Date(Number(event.startDate)).toLocaleTimeString(this.config.locale || undefined, { hour: "2-digit", minute: "2-digit" });

		const emoji = document.createElement("span");
		emoji.className = "fa-emoji";
		emoji.textContent = this.emojiFor(event);

		const title = document.createElement("span");
		title.className = "fa-title";
		title.textContent = event.title || "Event";
		const untilStr = this.multiDayEnd(event);
		if (untilStr) {
			const until = document.createElement("span");
			until.className = "fa-until";
			until.textContent = ` ${this.config.labels.until} ${untilStr}`;
			title.appendChild(until);
		}

		const wxEl = document.createElement("span");
		wxEl.className = "fa-wx";
		const wx = this.weatherByKey[this.keyFor(event)];
		if (this.config.showWeather && wx && wx.key) {
			wxEl.title = `${wx.temp}°`;
			wxEl.innerHTML = `${this.wxIcon(wx.key)}<small>${wx.temp}°</small>`;
		}

		const owners = document.createElement("span");
		owners.className = "fa-owners";
		for (const owner of event.owners || []) {
			const meta = this.personMeta(owner.name);
			const icon = document.createElement("span");
			icon.className = "fa-owner-icon";
			icon.textContent = meta.emoji;
			icon.title = owner.name;
			icon.style.setProperty("--owner-color", meta.color);
			owners.appendChild(icon);
		}

		row.append(when, emoji, title, owners, wxEl);
		return row;
	},

	// Formatted end of a multi-day event, or null for single-day ones. Full-day events use an
	// exclusive DTEND, so the last actual day is the day before the stored end date.
	multiDayEnd(event) {
		const s = Number(event.startDate);
		const e = Number(event.endDate || event.startDate);
		if (!(e - s > 36 * 3600 * 1000)) return null;
		const d = new Date(e);
		if (event.fullDayEvent) d.setDate(d.getDate() - 1);
		return d.toLocaleDateString(this.config.locale || undefined, { weekday: "short", day: "2-digit", month: "short" });
	},

	// A pinned row for a currently running event: "now  <emoji> <title> · until <end>".
	ongoingRow(event) {
		const row = document.createElement("div");
		row.className = "fa-event fa-ongoing";
		row.style.setProperty("--calendar-color", event.color || "#aeb6bf");

		const when = document.createElement("time");
		when.className = "fa-badge";
		when.textContent = this.config.labels.running;

		const emoji = document.createElement("span");
		emoji.className = "fa-emoji";
		emoji.textContent = this.emojiFor(event);

		const title = document.createElement("span");
		title.className = "fa-title";
		title.textContent = event.title || "Event";
		const endStr = this.multiDayEnd(event);
		if (endStr) {
			const until = document.createElement("span");
			until.className = "fa-until";
			until.textContent = ` · ${this.config.labels.until} ${endStr}`;
			title.appendChild(until);
		}

		const owners = document.createElement("span");
		owners.className = "fa-owners";
		for (const owner of event.owners || []) {
			const meta = this.personMeta(owner.name);
			const icon = document.createElement("span");
			icon.className = "fa-owner-icon";
			icon.textContent = meta.emoji;
			icon.title = owner.name;
			icon.style.setProperty("--owner-color", meta.color);
			owners.appendChild(icon);
		}

		const wxEl = document.createElement("span");
		wxEl.className = "fa-wx";

		row.append(when, emoji, title, owners, wxEl);
		return row;
	},

	relativeDay(date) {
		const a = new Date(); a.setHours(0, 0, 0, 0);
		const b = new Date(date); b.setHours(0, 0, 0, 0);
		const delta = Math.round((b - a) / 86400000);
		if (delta === 0) return this.config.labels.today;
		if (delta === 1) return this.config.labels.tomorrow;
		if (delta === 2) {
			if (this.config.labels.dayAfterTomorrow) return this.config.labels.dayAfterTomorrow;
			const globalLocale = typeof config !== "undefined" ? (config.locale || config.language) : null;
			const locale = this.config.locale || globalLocale || "";
			if (/^de(?:-|$)/i.test(locale)) return "Übermorgen";
		}
		return b.toLocaleDateString(this.config.locale || undefined, { day: "2-digit", month: "2-digit" });
	},

	dayKey(timestamp) {
		const d = new Date(timestamp);
		return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	}
});
