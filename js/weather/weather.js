var weather = {
	// Default language is Dutch because that is what the original author used
	lang: config.lang || 'nl',
	params: config.weather.params || null,
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
	updateInterval: config.weather.interval || 6000,
	fadeInterval: config.weather.fadeInterval || 1000,
	intervalId: null,
	orientation: config.weather.orientation || 'vertical',
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
				_iconClass = this.iconTable[data.weather[0].icon];

			var _icon = '<span class="icon ' + _iconClass + ' dimmed wi"></span>';

			var _newTempHtml = _icon + '' + _temperature + '&deg;';

			$(this.temperatureLocation).updateWithText(_newTempHtml, this.fadeInterval);

			var _now = moment().format('HH:mm'),
				_sunrise = moment(data.sys.sunrise*1000).format('HH:mm'),
				_sunset = moment(data.sys.sunset*1000).format('HH:mm');

			var _newWindHtml = '<span class="wind"><span class="wi wi-strong-wind xdimmed"></span> ' + this.ms2Beaufort(_wind) + '</span>',
				_newSunHtml = '<span class="sun"><span class="wi wi-sunrise xdimmed"></span> ' + _sunrise + '</span>';

			if (_sunrise < _now && _sunset > _now) {
				_newSunHtml = '<span class="sun"><span class="wi wi-sunset xdimmed"></span> ' + _sunset + '</span>';
			}

			$(this.windSunLocation).updateWithText(_newWindHtml + ' ' + _newSunHtml,this.fadeInterval);

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
				_forecastHtml = '<tr>',
				_forecastHtml2 = '<tr>',
				_forecastHtml3 = '<tr>',
				_forecastHtml4 = '<tr>';

			_forecastHtml = '<table class="forecast-table"><tr>';

			for (var i = 0, count = data.list.length; i < count; i++) {

				var _forecast = data.list[i];

				//don't show yesterday's forecast; each date, .dt is 12p local;
				var _12hours = 60 * 60 * 12 * 1000;
				if (_forecast.dt < Math.floor((Date.now() - _12hours) / 1000)) continue;

				if (this.orientation == 'vertical') {
					_forecastHtml2 = '';
					_forecastHtml3 = '';
					_forecastHtml4 = '';
				}

				_forecastHtml += '<td style="opacity:' + _opacity + '" class="day">' + moment(_forecast.dt, 'X').format('ddd') + '</td>';
				_forecastHtml2 += '<td style="opacity:' + _opacity + '" class="icon-small ' + this.iconTable[_forecast.weather[0].icon] + '"></td>';
				_forecastHtml3 += '<td style="opacity:' + _opacity + '" class="temp-max">' + this.roundValue(_forecast.temp.max) + '</td>';
				_forecastHtml4 += '<td style="opacity:' + _opacity + '" class="temp-min">' + this.roundValue(_forecast.temp.min) + '</td>';

				_opacity -= 0.155;

				if (this.orientation == 'vertical') {
					_forecastHtml += _forecastHtml2 + _forecastHtml3 + _forecastHtml4 + '</tr>';
				}
			}
			_forecastHtml  += '</tr>',
			_forecastHtml2 += '</tr>',
			_forecastHtml3 += '</tr>',
			_forecastHtml4 += '</tr>';
			
			if (this.orientation == 'vertical') {
				_forecastHtml += '</table>';
			} else {
				_forecastHtml += _forecastHtml2 + _forecastHtml3 + _forecastHtml4 +'</table>';
			}

			$(this.forecastLocation).updateWithText(_forecastHtml, this.fadeInterval);

		}.bind(this),
		error: function () {

		}
	});

}

weather.init = function () {

	if (this.params.lang === undefined) {
		this.params.lang = this.lang;
	}

	if (this.params.cnt === undefined) {
		this.params.cnt = 6;
	}

	this.intervalId = setInterval(function () {
		this.updateCurrentWeather();
		this.updateWeatherForecast();
	}.bind(this), this.updateInterval);
	this.updateCurrentWeather();
	this.updateWeatherForecast();
}
