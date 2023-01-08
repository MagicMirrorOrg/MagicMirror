// const HOUR_MS = 1000 * 60 * 60;
const weatherApiKey = "c9852542607b8aa68f57a3f3ec3504a6";

const dayArray = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

const parseWeatherUpdateJsonAsForecastTable = (weatherUpdateJson, daysAhead = 0) => {
	const datapointsPerDay = weatherUpdateJson.list.reduce((acc, datapoint) => {
		const date = datapoint["dt_txt"].split(" ")[0]; // dt_txt is timestamp of datapoint
		if (date in acc) {
			acc[date].push(datapoint);
		} else {
			acc[date] = [datapoint];
		}
		return acc;
	}, {});

	const overallPerDay = Object.entries(datapointsPerDay).map(([date, points]) => {
		let high = 0;
		let low = Infinity;

		points.forEach((point) => {
			if (point.main["temp_min"] < low) {
				low = point.main["temp_min"];
			}

			if (point.main["temp_max"] > high) {
				high = point.main["temp_max"];
			}
		});

		return {
			date,
			high,
			low
		};
	});

	return overallPerDay
		.map((day, index) => {
			const highs = getTranslatedUnitsForKelvinValue(day.high);
			const lows = getTranslatedUnitsForKelvinValue(day.low);
			return `
			<tr>
				<td>${index === 0 ? "Today" : dayArray[new Date(day.date).getDay()]}</td>
				<td style="color:coral">${highs.f}°F / ${highs.c}°C</td>
				<td style="color:#6495ED">${lows.f}°F / ${lows.c}°C</td>
			</tr>
		`;
		})
		.join("");
};

const weatherUpdate = async () => {
	const weatherUpdateJson = await fetchWeatherUpdate();

	console.log({ weatherUpdateJson });

	const currentActualTempurature = weatherUpdateJson.list[0].main.temp;
	const currentFeelsLikeTempurature = weatherUpdateJson.list[0].main.feels_like;

	const current = {
		actual: getTranslatedUnitsForKelvinValue(currentActualTempurature),
		feelsLike: getTranslatedUnitsForKelvinValue(currentFeelsLikeTempurature)
	};

	document.getElementById("weatherActualTemp").textContent = `${current.actual.f}°F / ${current.actual.c}°C`;
	document.getElementById("weatherFeelsLikeTemp").textContent = `Feels like ${current.feelsLike.f}°F / ${current.feelsLike.c}°C`;

	document.getElementById("weatherForecastTable").innerHTML = parseWeatherUpdateJsonAsForecastTable(weatherUpdateJson, 3);
};

const weatherRunner = () => {
	weatherUpdate();
	setInterval(weatherUpdate, HOUR_MS * 3);
};

weatherRunner();
