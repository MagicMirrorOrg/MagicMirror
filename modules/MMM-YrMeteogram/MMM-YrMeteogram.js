Module.register("MMM-YrMeteogram", {
	defaults: {
		locationId: "1-72837",
		lang: "nb",
		updateInterval: 30 * 60 * 1000, // 30 minutes
		width: "400px",
	},

	getStyles() {
		return ["MMM-YrMeteogram.css"];
	},

	start() {
		this.scheduleUpdate();
	},

	scheduleUpdate() {
		this.updateDom();
		setInterval(() => this.updateDom(), this.config.updateInterval);
	},

	getDom() {
		const wrapper = document.createElement("div");
		const { locationId, lang, width } = this.config;

		const langPath = lang === "nb" ? "nb/innhold" : `${lang}/content`;
		const url = `https://www.yr.no/${langPath}/${locationId}/meteogram.svg?mode=dark&_=${Date.now()}`;

		const img = document.createElement("img");
		img.src = url;
		img.style.width = width;
		img.style.display = "block";
		img.alt = "Yr meteogram";

		wrapper.appendChild(img);
		return wrapper;
	},
});
