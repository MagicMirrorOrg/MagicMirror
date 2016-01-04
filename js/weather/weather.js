var weather = {
	// Default language is Dutch because that is what the original author used
	lang: config.lang || 'en',
	params: keys.weather.params || null,
	iconTable: {
		'01d':'wi-day-sunny',
		'02d':'wi-day-cloudy',
		'03d':'wi-cloudy',
		'04d':'wi-cloudy-windy',
		'09d':'wi-showers',
		'10d':'wi-rain',
		'11d':'wi-thunderstorm',
		'13d':'wi-snow',
		'50d':'wi-fog',
		'01n':'wi-night-clear',
		'02n':'wi-night-cloudy',
		'03n':'wi-night-cloudy',
		'04n':'wi-night-cloudy',
		'09n':'wi-night-showers',
		'10n':'wi-night-rain',
		'11n':'wi-night-thunderstorm',
		'13n':'wi-night-snow',
		'50n':'wi-night-alt-cloudy-windy'
	},
	temperatureLocation: '.temp',
	windSunLocation: '.windsun',
	forecastLocation: '.forecast',
	apiVersion: '2.5',
	apiBase: 'http://api.openweathermap.org/data/',
	weatherEndpoint: 'weather',
	forecastEndpoint: 'forecast/daily',
	updateInterval: keys.weather.interval || 6000,
	fadeInterval: keys.weather.fadeInterval || 1000,
	intervalId: null
}

/**
 * Rounds a float to one decimal place
 * @param  {float} temperature The temperature to be rounded
 * @return {float}             The new floating point value
 */
weather.roundValue = function (temperature) {
	return parseFloat(temperature).toFixed(1);
}

/**
 * Converts the wind speed (km/h) into the values given by the Beaufort Wind Scale
 * @see http://www.spc.noaa.gov/faq/tornado/beaufort.html
 * @param  {int} kmh The wind speed in Kilometers Per Hour
 * @return {int}     The wind speed converted into its corresponding Beaufort number
 */
weather.ms2Beaufort = function(ms) {
	var kmh = ms * 60 * 60 / 1000;
	var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
	for (var beaufort in speeds) {
		var speed = speeds[beaufort];
		if (speed > kmh) {
			return beaufort;
		}
	}
	return 12;
}

/**
 * Retrieves the current temperature and weather patter from the OpenWeatherMap API
 */
weather.updateCurrentWeather = function () {

	$.ajax({
		type: 'GET',
		url: weather.apiBase + '/' + weather.apiVersion + '/' + weather.weatherEndpoint,
		dataType: 'json',
		data: weather.params,
		success: function (data) {

			var _temperature = this.roundValue(data.main.temp),
				_temperatureMin = this.roundValue(data.main.temp_min),
				_temperatureMax = this.roundValue(data.main.temp_max),
				_wind = this.roundValue(data.wind.speed),
				_windDirectionDeg = this.roundValue(data.wind.deg),
				_windDirection = 'N',
				_iconClass = this.iconTable[data.weather[0].icon];

			var _icon = '<span class="icon ' + _iconClass + ' dimmed wi"></span>';
			
			if (_windDirectionDeg >= 11.25 && _windDirectionDeg < 33.75) {
				_windDirection = 'NNE';
			} else if (_windDirectionDeg >= 33.75 && _windDirectionDeg < 56.25) {
				_windDirection = 'NE';
			} else if (_windDirectionDeg >= 56.25 && _windDirectionDeg < 78.75) {
				_windDirection = 'ENE';
			} else if (_windDirectionDeg >= 78.75 && _windDirectionDeg < 101.25) {
				_windDirection = 'E';
			} else if (_windDirectionDeg >= 101.25 && _windDirectionDeg < 123.75) {
				_windDirection = 'ESE';
			} else if (_windDirectionDeg >= 123.75 && _windDirectionDeg < 146.25) {
				_windDirection = 'SE';
			} else if (_windDirectionDeg >= 146.25 && _windDirectionDeg < 168.75) {
				_windDirection = 'SSE';
			} else if (_windDirectionDeg >= 168.75 && _windDirectionDeg < 191.25) {
				_windDirection = 'S';
			} else if (_windDirectionDeg >= 191.25 && _windDirectionDeg < 213.75) {
				_windDirection = 'SSW';
			} else if (_windDirectionDeg >= 213.75 && _windDirectionDeg < 236.25) {
				_windDirection = 'SW';
			} else if (_windDirectionDeg >= 236.25 && _windDirectionDeg < 258.75) {
				_windDirection = 'WSW';
			} else if (_windDirectionDeg >= 258.75 && _windDirectionDeg < 281.25) {
				_windDirection = 'W';
			} else if (_windDirectionDeg >= 281.25 && _windDirectionDeg < 303.75) {
				_windDirection = 'WNW';
			} else if (_windDirectionDeg >= 303.75 && _windDirectionDeg < 326.25) {
				_windDirection = 'NW';
			} else if (_windDirectionDeg >= 326.25 && _windDirectionDeg < 348.75) {
				_windDirection = 'NNW';
			} else {
				_windDirection = 'N';
			} 
			
			var _newTempHtml = _icon + '' + _temperature + '&deg;';

			$(this.temperatureLocation).updateWithText(_newTempHtml, this.fadeInterval);

			var _now = moment().format('HH:mm'),
				_sunrise = moment(data.sys.sunrise*1000).format('HH:mm') + 'AM',
				_sunset = moment(data.sys.sunset*1000).format('HH:mm');
				_sunset12 = moment(data.sys.sunset*1000).format('hh:mm') + 'PM';
				
			var _newWindHtml = '<span class="wi wi-strong-wind xdimmed"></span> ' + _wind + 'mph ' + _windDirection, //this.ms2Beaufort(_wind),
				_newSunHtml = '<span class="wi wi-sunrise xdimmed"></span> ' + _sunrise;

			if (_sunrise < _now && _sunset > _now) {
				_newSunHtml = '<span class="wi wi-sunset xdimmed"></span> ' + _sunset12;
			}

			$(this.windSunLocation).updateWithText(_newWindHtml + ' ' + _newSunHtml, this.fadeInterval);

		}.bind(this),
		error: function () {

		}
	});

}

/**
 * Updates the 5 Day Forecast from the OpenWeatherMap API
 */
weather.updateWeatherForecast = function () {

	$.ajax({
		type: 'GET',
		url: weather.apiBase + '/' + weather.apiVersion + '/' + weather.forecastEndpoint,
		data: weather.params,
		success: function (data) {

			var _opacity = 1,
				_forecastHtml = '';

			_forecastHtml += '<table class="forecast-table">';

			for (var i = 0, count = data.list.length; i < count; i++) {

				var _forecast = data.list[i];

				_forecastHtml += '<tr style="opacity:' + _opacity + '">';

				_forecastHtml += '<td class="day">' + moment(_forecast.dt, 'X').format('ddd') + '</td>';
				_forecastHtml += '<td class="icon-small ' + this.iconTable[_forecast.weather[0].icon] + '"></td>';
				_forecastHtml += '<td class="temp-max">' + this.roundValue(_forecast.temp.max) + '</td>';
				_forecastHtml += '<td class="temp-min">' + this.roundValue(_forecast.temp.min) + '</td>';

				_forecastHtml += '</tr>';

				_opacity -= 0.155;

			}

			_forecastHtml += '</table>';

			$(this.forecastLocation).updateWithText(_forecastHtml, this.fadeInterval);

		}.bind(this),
		error: function () {

		}
	});

}

window.onload = function(){
	//canvas init
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	
	//canvas dimensions
	var W = window.innerWidth;
	var H = window.innerHeight;
	canvas.width = W;
	canvas.height = H;
	
	$.ajax({
		type: 'GET',
		url: weather.apiBase + '/' + weather.apiVersion + '/' + weather.weatherEndpoint,
		dataType: 'json',
		data: weather.params,
		success: function (data) {

			_snowEffectActive = 'N';

			if(data.weather[0].icon == '13d' || data.weather[0].icon == '13n'){
				_snowEffectActive = 'Y';
			}

		}.bind(this),
		error: function () {

		}
	});
	
	//snowflake particles
	var mp = 25; //max particles
	var particles = [];
	for(var i = 0; i < mp; i++)
	{
		particles.push({
			x: Math.random()*W, //x-coordinate
			y: Math.random()*H, //y-coordinate
			r: Math.random()*4+1, //radius
			d: Math.random()*mp //density
		})
	}
	
	//Lets draw the flakes
	function draw()
	{
		ctx.clearRect(0, 0, W, H);
		
		if(_snowEffectActive == 'Y'){
			ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
		} else {
			ctx.fillStyle = "rgba(255, 255, 255, 0)";
		}
		ctx.beginPath();
		for(var i = 0; i < mp; i++)
		{
			var p = particles[i];
			ctx.moveTo(p.x, p.y);
			ctx.arc(p.x, p.y, p.r, 0, Math.PI*2, true);
		}
		ctx.fill();
		update();
	}
	
	//Function to move the snowflakes
	//angle will be an ongoing incremental flag. Sin and Cos functions will be applied to it to create vertical and horizontal movements of the flakes
	var angle = 0;
	function update()
	{
		angle += 0.01;
		for(var i = 0; i < mp; i++)
		{
			var p = particles[i];
			//Updating X and Y coordinates
			//We will add 1 to the cos function to prevent negative values which will lead flakes to move upwards
			//Every particle has its own density which can be used to make the downward movement different for each flake
			//Lets make it more random by adding in the radius
			p.y += Math.cos(angle+p.d) + 1 + p.r/2;
			p.x += Math.sin(angle) * 2;
			
			//Sending flakes back from the top when it exits
			//Lets make it a bit more organic and let flakes enter from the left and right also.
			if(p.x > W+5 || p.x < -5 || p.y > H)
			{
				if(i%3 > 0) //66.67% of the flakes
				{
					particles[i] = {x: Math.random()*W, y: -10, r: p.r, d: p.d};
				}
				else
				{
					//If the flake is exitting from the right
					if(Math.sin(angle) > 0)
					{
						//Enter from the left
						particles[i] = {x: -5, y: Math.random()*H, r: p.r, d: p.d};
					}
					else
					{
						//Enter from the right
						particles[i] = {x: W+5, y: Math.random()*H, r: p.r, d: p.d};
					}
				}
			}
		}
	}
	
	//animation loop
	setInterval(draw, 33);
}

weather.init = function () {

	if (this.params.lang === undefined) {
		this.params.lang = this.lang;
	}

	if (this.params.cnt === undefined) {
		this.params.cnt = 5;
	}

	this.intervalId = setInterval(function () {
		this.updateCurrentWeather();
		this.updateWeatherForecast();
	}.bind(this), this.updateInterval);

}
