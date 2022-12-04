const HOUR_MS = 1000 * 60 * 60;

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

const weatherUpdate = () => {};

const eldyMirrorRunner = () => {
	console.log("hello world");

	document.documentElement.style.cursor = "none";

	clockUpdate();
	setInterval(clockUpdate, 1000);

	weatherUpdate();
	setInterval(weatherUpdate, HOUR_MS * 6);
};

eldyMirrorRunner();
