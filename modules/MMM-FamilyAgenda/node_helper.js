/* MMM-FamilyAgenda node_helper — optional weather per event location.
 * Event LOCATION -> geocode (OpenStreetMap Nominatim) -> OpenWeather 5-day/3h forecast
 * -> weather category at the slot nearest the event start. Geo cached permanently,
 * forecast cached 1 h. Returns a category key; the frontend renders an inline SVG. */
const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
	start() {
		this.geoCache = {};   // location -> {lat,lon} | null
		this.fcCache = {};    // "lat,lon" -> {ts, list}
		this.appid = null;
		this.busy = false;
	},

	socketNotificationReceived(n, p) {
		if (n === "FA_WEATHER_REQ") {
			this.appid = p.appid;
			this.handle(p.events || []);
		}
	},

	get(url, headers) {
		return new Promise((resolve, reject) => {
			https.get(url, { headers: headers || {} }, (res) => {
				let d = "";
				res.on("data", (c) => (d += c));
				res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
			}).on("error", reject);
		});
	},

	async geocode(loc) {
		if (loc in this.geoCache) return this.geoCache[loc];
		const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`;
		try {
			const r = await this.get(url, { "User-Agent": "MagicMirror-FamilyAgenda/1.0 (home mirror)" });
			if (Array.isArray(r) && r.length) {
				const g = { lat: parseFloat(r[0].lat), lon: parseFloat(r[0].lon) };
				this.geoCache[loc] = g;
				return g;
			}
		} catch (e) { /* ignore */ }
		this.geoCache[loc] = null;
		return null;
	},

	async forecast(lat, lon) {
		const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
		const c = this.fcCache[key];
		if (c && Date.now() - c.ts < 3600000) return c.list;
		const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.appid}`;
		try {
			const r = await this.get(url);
			if (r && Array.isArray(r.list)) {
				this.fcCache[key] = { ts: Date.now(), list: r.list };
				return r.list;
			}
		} catch (e) { /* ignore */ }
		return null;
	},

	// OpenWeather condition id -> weather category key (rendered as inline SVG in the frontend)
	catKey(id) {
		if (id >= 200 && id < 300) return "storm";
		if (id >= 300 && id < 600) return "rain";
		if (id >= 600 && id < 700) return "snow";
		if (id >= 700 && id < 800) return "fog";
		if (id === 800) return "sun";
		return "cloud";
	},

	async handle(events) {
		if (this.busy) return;
		this.busy = true;
		const out = {};
		const now = Date.now();
		const horizon = now + 5 * 86400000;
		try {
			for (const ev of events) {
				const loc = String(ev.location || "").trim();
				const start = Number(ev.startDate);
				if (!loc || !start || start < now - 3600000 || start > horizon) continue;
				const g = await this.geocode(loc);
				if (!g) continue;
				const list = await this.forecast(g.lat, g.lon);
				if (!list) continue;
				let best = null, bestDiff = Infinity;
				for (const it of list) {
					const diff = Math.abs(it.dt * 1000 - start);
					if (diff < bestDiff) { bestDiff = diff; best = it; }
				}
				if (best && bestDiff <= 3 * 3600000 + 60000) {
					const wid = (best.weather && best.weather[0]) ? best.weather[0].id : 800;
					out[ev.key] = { key: this.catKey(wid), temp: Math.round(best.main.temp) };
				}
			}
			this.sendSocketNotification("FA_WEATHER_DATA", out);
		} finally {
			this.busy = false;
		}
	}
});
