const clockUpdate = () => {
	document.getElementById("clockDate").textContent = new Date(Date.now()).toDateString();

	const currentTime = new Date(Date.now());
	const [h, m, s] = [currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds()].map(padTwoZeros);

	const hourModulo = h % 12;

	const currentTimeString12hr = `${hourModulo === 0 ? 12 : hourModulo}:${m}${h >= 12 ? "pm" : "am"}`;
	const currentTimeString24hr = `${h}:${m}:${s}`;

	document.getElementById("clockTime12hr").textContent = currentTimeString12hr;
	document.getElementById("clockTime24hr").textContent = currentTimeString24hr;
};

const clockMillisecondUpdate = () => {
	const currentTime = Date.now();

	document.getElementById("clockUnixTime").textContent = currentTime;
};

const clockRunner = () => {
	clockUpdate();
	setInterval(clockUpdate, 1000);

	clockMillisecondUpdate();
	setInterval(clockMillisecondUpdate, 1);
};

clockRunner();
