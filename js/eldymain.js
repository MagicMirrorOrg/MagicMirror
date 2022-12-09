const HOUR_MS = 1000 * 60 * 60;
const weatherApiKey = "c9852542607b8aa68f57a3f3ec3504a6";

const padTwoZeros = (n) => String(n).padStart(2, "0");

const roundToOneDecimal = (n) => Math.round(n * 10) / 10;

const kelvinToFahrenheit = (k) => {
	return kelvinToCelsius(k) * (9 / 5) + 32;
};

const kelvinToCelsius = (k) => {
	return k - 273.15;
};

const getTranslatedUnitsForKelvinValue = (k) => {
	return {
		c: roundToOneDecimal(kelvinToCelsius(k)),
		f: roundToOneDecimal(kelvinToFahrenheit(k))
	};
};

const recursivelyReadStream = async (stream) => {
	const output = await stream.read();
	if (output.done) {
		return output.value;
	}

	const nextValue = await recursivelyReadStream(stream);
	if (nextValue === undefined) {
		return output.value;
	}

	return new Uint8Array([...output.value, ...nextValue]);
};

const fetchWeatherUpdate = async () => {
	// get weather forecast for austin
	const requestUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=30.2672&lon=-97.7431&appid=${weatherApiKey}`;
	const result = await fetch(requestUrl);
	const readBody = await recursivelyReadStream(result.body.getReader());

	const readBodyString = new TextDecoder("utf-8").decode(readBody);
	const readBodyStringJson = JSON.parse(readBodyString);

	return readBodyStringJson;
};

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

const weatherUpdate = async () => {
	const weatherUpdateJson = await fetchWeatherUpdate();

	console.log(weatherUpdateJson);

	const currentActualTempurature = weatherUpdateJson.list[0].main.temp;
	const currentFeelsLikeTempurature = weatherUpdateJson.list[0].main.feels_like;

	const current = {
		actual: getTranslatedUnitsForKelvinValue(currentActualTempurature),
		feelsLike: getTranslatedUnitsForKelvinValue(currentFeelsLikeTempurature)
	};

	document.getElementById("weatherActualTemp").textContent = `${current.actual.f}F / ${current.actual.c}C`;
	document.getElementById("weatherFeelsLikeTemp").textContent = `Feels like ${current.feelsLike.f}F / ${current.feelsLike.c}C`;
};

const setStatsForNerds = () => {
	// const commitHash = require('./package.json')
	const currentTime = new Date(Date.now());

	document.getElementById("statsForNerdsString").textContent = `Boot at: ${currentTime}`;
};

const eldyMirrorRunner = () => {
	console.log("hello world");

	document.documentElement.style.cursor = "none";

	clockUpdate();
	setInterval(clockUpdate, 1000);

	weatherUpdate();
	setInterval(weatherUpdate, HOUR_MS * 6);

	setStatsForNerds();
};

eldyMirrorRunner();
