const padTwoZeros = (n) => String(n).padStart(2, "0");

const clockUpdate = () => {
	document.getElementById("clockDate").textContent = new Date(Date.now()).toDateString();

	const currentTime = new Date(Date.now());
	const h = padTwoZeros(currentTime.getHours());
	const m = padTwoZeros(currentTime.getMinutes());
	const s = padTwoZeros(currentTime.getSeconds());

	const currentTimeString = `${h}:${m}:${s}`;

	document.getElementById("clockTime").textContent = currentTimeString;
};

const eldyMirrorRunner = () => {
	console.log("hello world");

	document.documentElement.style.cursor = "none";

	setInterval(clockUpdate, 1000);
};

eldyMirrorRunner();
