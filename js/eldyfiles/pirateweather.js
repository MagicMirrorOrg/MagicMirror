const dayArray = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const celciusToFahrenheit = (c) => {
	return c * (9 / 5) + 32;
};

const getTranslatedUnitsForCelciusValue = (c) => {
	return {
		c: roundToOneDecimal(c),
		f: roundToOneDecimal(celciusToFahrenheit(c))
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

const parseWeatherUpdateJsonAsForecastTable = (weatherUpdateJson) => {
	return weatherUpdateJson.daily.data
		.map((day, index) => {
			const highs = getTranslatedUnitsForCelciusValue(day.temperatureMax);
			const lows = getTranslatedUnitsForCelciusValue(day.temperatureMin);

			const displayDay = index === 0 ? "Today" : dayArray[new Date(day.time * 1000).getDay()];

			return `
            <tr>
                <td>${displayDay}</td>

                <td style="color:coral">${highs.f}°f</td>
                <td style="color:coral">/</td>
                <td style="color:coral">${highs.c}°c</td>

                <td style="color:#6495ED">${lows.f}°f</td>
                <td style="color:#6495ED">/</td>
                <td style="color:#6495ED">${lows.c}°c</td>
            </tr>
        `;
		})
		.join("");
};

const fetchPirateWeatherUpdate = async () => {
	// get weather forecast for austin
	const requestUrl = "https://merry-sky.onrender.com/weather?q=cedar%20park";
	const result = await fetch(requestUrl);
	const readBody = await recursivelyReadStream(result.body.getReader());

	const readBodyString = new TextDecoder("utf-8").decode(readBody);
	const readBodyStringJson = JSON.parse(readBodyString);

	return readBodyStringJson;
};

const weatherUpdate = async () => {
	const weatherUpdateJson = await fetchPirateWeatherUpdate();

	console.log({ weatherUpdateJson });

	const currentActualTempurature = weatherUpdateJson.currently.temperature;
	const currentFeelsLikeTempurature = weatherUpdateJson.currently.apparentTemperature;

	const current = {
		actual: getTranslatedUnitsForCelciusValue(currentActualTempurature),
		feelsLike: getTranslatedUnitsForCelciusValue(currentFeelsLikeTempurature)
	};

	document.getElementById("weatherLocation").textContent = `weather | ${weatherUpdateJson.location.name}`;
	document.getElementById("weatherActualTemp").textContent = `${current.actual.f}°f / ${current.actual.c}°c`;
	document.getElementById("weatherFeelsLikeTemp").textContent = `feels like ${current.feelsLike.f}°f / ${current.feelsLike.c}°c`;
	document.getElementById("weatherHumidity").textContent = `${roundToOneDecimal(weatherUpdateJson.currently.humidity * 100)}% humidity`;
	document.getElementById("weatherCloudCover").textContent = `${roundToOneDecimal(weatherUpdateJson.currently.cloudCover * 100)}% cloud cover`;

	document.getElementById("weatherForecastTable").innerHTML = parseWeatherUpdateJsonAsForecastTable(weatherUpdateJson);
};

const weatherRunner = () => {
	weatherUpdate();
	setInterval(weatherUpdate, HOUR_MS * 3);
};

weatherRunner();
