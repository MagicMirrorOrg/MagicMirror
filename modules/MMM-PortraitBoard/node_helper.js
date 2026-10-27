const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	start() {
		this.timers = {};
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "PORTRAIT_CONNECTIVITY_START") {
			this.startConnectivity(payload);
			return;
		}
		if (notification !== "PORTRAIT_WEATHER_START") return;
		clearTimeout(this.timers[payload.identifier]);
		this.fetchWeather(payload);
	},

	// One shared check for all connected browsers; a new browser just gets the current state.
	startConnectivity(config) {
		if (this.connectivity) {
			this.sendSocketNotification("PORTRAIT_CONNECTIVITY", { online: this.connectivity.online });
			return;
		}
		this.connectivity = { online: true, failures: 0 };
		this.checkConnectivity(config);
	},

	async checkConnectivity(config) {
		let reachable = false;
		try {
			// Any HTTP response, even an error status, proves the internet is reachable.
			await fetch(config.url, { method: "HEAD", signal: AbortSignal.timeout(10 * 1000) });
			reachable = true;
		} catch {
			reachable = false;
		}

		const state = this.connectivity;
		state.failures = reachable ? 0 : state.failures + 1;
		// Go offline only after several failures in a row, but come back on the first success.
		const online = reachable || (state.online && state.failures < config.failuresBeforeOffline);
		if (online !== state.online) {
			state.online = online;
			console.log(`[MMM-PortraitBoard] Connection ${online ? "restored" : "lost"}`);
			this.sendSocketNotification("PORTRAIT_CONNECTIVITY", { online });
		}
		setTimeout(() => this.checkConnectivity(config), config.interval);
	},

	async fetchWeather(config) {
		try {
			const url = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
			url.searchParams.set("lat", config.lat);
			url.searchParams.set("lon", config.lon);
			const response = await fetch(url, { headers: { "User-Agent": "MagicMirror-Oslo-Edition/1.0 (https://github.com/nrkno/MagicMirror)" } });
			if (!response.ok) throw new Error(`Yr returned HTTP ${response.status}`);
			const data = await response.json();
			const series = data.properties.timeseries;
			const current = series[0];
			const symbol = current.data.next_1_hours?.summary?.symbol_code || current.data.next_6_hours?.summary?.symbol_code || "";
			const next = series.find((point) => new Date(point.time) > Date.now() + 3 * 60 * 60 * 1000);
			const nextSymbol = next?.data.next_1_hours?.summary?.symbol_code || "";
			const rainy = /rain|sleet|snow|showers/.test(symbol);
			const laterRain = /rain|sleet|snow|showers/.test(nextSymbol);
			this.sendSocketNotification("PORTRAIT_WEATHER", {
				identifier: config.identifier,
				weather: {
					temperature: current.data.instant.details.air_temperature,
					symbol: rainy ? "☂" : /clearsky|fair/.test(symbol) ? "☀" : "☁",
					summary: rainy ? "Nedbør nå" : laterRain ? "Nedbør senere i dag" : "Opphold utover dagen",
					homeSummary: rainy ? "Nedbør på vei hjem" : "Opphold på vei hjem"
				}
			});
		} catch (error) {
			console.error("[MMM-PortraitBoard] Yr:", error.message);
		}
		this.timers[config.identifier] = setTimeout(() => this.fetchWeather(config), Math.max(10 * 60 * 1000, config.updateInterval));
	}
});
