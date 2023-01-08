const padTwoZeros = (n) => String(n).padStart(2, "0");

const roundToOneDecimal = (n) => Math.round(n * 10) / 10;

const setStatsForNerds = () => {
	// const commitHash = require('./package.json')
	const currentTime = new Date(Date.now());

	document.getElementById("statsForNerdsString").textContent = `Boot at: ${currentTime}`;
};

const eldyMirrorRunner = () => {
	document.documentElement.style.cursor = "none";

	setStatsForNerds();
};

eldyMirrorRunner();
