const NodeHelper = require("node_helper");
const Log = require("logger");
const { fetch } = require("undici");

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

/**
 *
 * @param deg
 */
function degreesToCompass (deg) {
	return COMPASS[Math.round(deg / 22.5) % 16];
}

/**
 *
 * @param mps
 */
function mpsToKnots (mps) {
	return Math.round(mps * 1.94384 * 10) / 10;
}

// Strip HTML tags and decode basic entities from EC summary text
/**
 *
 * @param html
 */
function stripHtml (html) {
	return html
		.replace(/&#60;/g, "<") // decode encoded < before tag stripping
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/<br\s*\/?>/gi, " ")
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

// Extract text content between XML tags (first match)
/**
 *
 * @param xml
 * @param tag
 */
function xmlText (xml, tag) {
	const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
	return m ? m[1].trim() : "";
}

// Parse Atom XML into array of { title, category, summary, updated }
/**
 *
 * @param xml
 */
function parseAtomEntries (xml) {
	const entries = [];
	const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
	let match;
	while ((match = entryRe.exec(xml)) !== null) {
		const block = match[1];
		const categoryMatch = block.match(/<category\s+term="([^"]+)"/i);
		entries.push({
			title: stripHtml(xmlText(block, "title")),
			category: categoryMatch ? categoryMatch[1] : "",
			summary: stripHtml(xmlText(block, "summary")),
			updated: xmlText(block, "updated")
		});
	}
	return entries;
}

const WARNING_LEVELS = ["HURRICANE FORCE WARNING", "STORM WARNING", "GALE WARNING", "STRONG WIND WARNING"];

module.exports = NodeHelper.create({
	start () {
		Log.log(`Starting node helper for: ${this.name}`);
		this.config = null;
		this.timers = {};
		this.lastForecastText = null;
		this.lastRewriteResult = null;
	},

	stop () {
		for (const t of Object.values(this.timers)) clearTimeout(t);
		this.timers = {};
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "CONFIG" && !this.config) {
			this.config = payload;
			this.fetchModel();
			this.fetchBuoy();
			this.fetchForecast();
		}
	},

	schedule (key, fn, interval) {
		this.timers[key] = setTimeout(() => fn.call(this), interval);
	},

	// ── Open-Meteo GEM ────────────────────────────────────────────────────────

	async fetchModel () {
		const { lat, lon, modelInterval } = this.config;
		const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m&wind_speed_unit=kn&models=gem_seamless`;
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			const c = json.current;
			this.sendSocketNotification("WIND_MODEL", {
				speed: Math.round(c.wind_speed_10m * 10) / 10,
				gust: Math.round(c.wind_gusts_10m * 10) / 10,
				direction: c.wind_direction_10m,
				directionLabel: degreesToCompass(c.wind_direction_10m),
				error: null
			});
		} catch (err) {
			Log.error("Wind: Open-Meteo fetch error:", err.message);
			this.sendSocketNotification("WIND_MODEL", { error: err.message });
		}
		this.schedule("model", this.fetchModel, modelInterval);
	},

	// ── SmartAtlantic Herring Cove buoy ───────────────────────────────────────

	async fetchBuoy () {
		const { buoyInterval, staleThresholdMinutes } = this.config;
		const url = "https://www.smartatlantic.ca/erddap/tabledap/SMA_halifax.json?time,wind_spd_avg,wind_spd_max,wind_dir_avg&orderByMax(%22time%22)";
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			const row = json.table.rows[0];
			if (!row) throw new Error("No buoy data");

			const [timeStr, avgMps, maxMps, dirDeg] = row;
			const observedAt = new Date(timeStr);
			const minutesAgo = Math.round((Date.now() - observedAt.getTime()) / 60000);
			const stale = minutesAgo > staleThresholdMinutes;

			// Format observed time in Atlantic Time
			const localTime = observedAt.toLocaleString("en-CA", {
				timeZone: "America/Halifax",
				hour: "numeric",
				minute: "2-digit",
				hour12: true
			});

			this.sendSocketNotification("WIND_BUOY", {
				speed: mpsToKnots(avgMps),
				gust: mpsToKnots(maxMps),
				direction: dirDeg,
				directionLabel: degreesToCompass(dirDeg),
				observedAt: localTime,
				minutesAgo,
				stale,
				error: null
			});
		} catch (err) {
			Log.error("Wind: buoy fetch error:", err.message);
			this.sendSocketNotification("WIND_BUOY", { error: err.message });
		}
		this.schedule("buoy", this.fetchBuoy, buoyInterval);
	},

	// ── Environment Canada marine forecast ────────────────────────────────────

	async fetchForecast () {
		const { forecastInterval } = this.config;
		const url = "https://weather.gc.ca/rss/marine/06000_e.xml";
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const xml = await res.text();

			const entries = parseAtomEntries(xml);

			// Active warnings: entries whose title contains a known warning phrase
			const warnings = entries
				.filter((e) => WARNING_LEVELS.some((w) => e.title.toUpperCase().includes(w)))
				.map((e) => {
					const level = WARNING_LEVELS.find((w) => e.title.toUpperCase().includes(w));
					return level;
				})
				.filter(Boolean);

			// Current forecast: first "Marine Forecasts" entry
			const forecastEntry = entries.find((e) => e.category === "Marine Forecasts");
			const rawText = forecastEntry ? forecastEntry.summary : null;

			let rewrittenText = null;
			if (rawText && this.config.groqApiKey) {
				if (rawText === this.lastForecastText) {
					rewrittenText = this.lastRewriteResult; // reuse cached result
				} else {
					rewrittenText = await this.rewriteForecast(rawText);
					this.lastForecastText = rawText;
					this.lastRewriteResult = rewrittenText;
				}
			}

			this.sendSocketNotification("WIND_FORECAST", {
				text: rewrittenText || rawText,
				title: forecastEntry ? forecastEntry.title : null,
				warnings,
				error: null
			});
		} catch (err) {
			Log.error("Wind: EC forecast fetch error:", err.message);
			this.sendSocketNotification("WIND_FORECAST", { error: err.message });
		}
		this.schedule("forecast", this.fetchForecast, forecastInterval);
	},

	async rewriteForecast (forecastText) {
		const SYSTEM_PROMPT = "You are a blunt, helpful advisor for a recreational boater on Halifax Harbour. "
		  + "The boater runs two 200hp centre-console-style powerboats (18–22 ft, Cobia dual console and Trophy centre console). "
		  + "These are capable boats that handle moderate chop and 15–20 knot winds comfortably — only genuinely rough conditions (sustained 25+ knots, large swells) warrant staying ashore. "
		  + "Rewrite the marine forecast below in plain language. No nautical jargon, no knot values, no compass bearings. "
		  + "Describe what the water will feel like: calm and glassy, light chop, whitecaps, or rough swells. "
		  + "If there's a calm window, say when it is. Mention rain or spray if relevant. "
		  + "End with a one-line verdict: great day to go out, fine but bumpy, or stay ashore. "
		  + "Be direct — no hedging with 'possibly' or 'might'. 2–3 short sentences plus the verdict. No preamble.";

		try {
			const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.config.groqApiKey}`
				},
				body: JSON.stringify({
					model: "llama-3.1-8b-instant",
					messages: [
						{ role: "system", content: SYSTEM_PROMPT },
						{ role: "user", content: forecastText }
					],
					max_tokens: 200
				})
			});
			if (!res.ok) {
				const errBody = await res.text().catch(() => "");
				throw new Error(`Groq HTTP ${res.status}: ${errBody.slice(0, 200)}`);
			}
			const json = await res.json();
			const text = json.choices?.[0]?.message?.content?.trim();
			if (!text) throw new Error("Empty Groq response");
			Log.log("Wind: forecast rewrite OK");
			return text;
		} catch (err) {
			Log.error("Wind: forecast rewrite failed:", err.message);
			return null;
		}
	}
});
