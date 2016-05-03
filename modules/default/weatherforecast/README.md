# Module: Weather Forecast
The `weatherforecast` module is one of the default modules of the MagicMirror.
This module displays the weather forecast for the coming week, including an an icon to display the current conditions, the minimum temperature and the maximum temperature.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'weatherforecast',
		position: 'top_right',	// This can be any of the regions.
									// Best results in left or right regions.
		config: {
			// See 'Configuration options' for more information.
			location: 'Amsterdam,Netherlands',
			appid: 'abcde12345abcde12345abcde12345ab' //openweathermap.org API key.
		}
	}
]
````

## Configuration options

The following properties can be configured:


<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>

		<tr>
			<td><code>location</code></td>
			<td>The location used for weather information.<br>
				<br><b>Example:</b> <code>Amsterdam,Netherlands</code>
				<br><b>Default value:</b> <code>New York</code>
			</td>
		</tr>
		<tr>
			<td><code>appid</code></td>
			<td>The <a href="https://home.openweathermap.org" target="_blank">OpenWeatherMap</a> API key, which can be obtained by creating an OpenWeatherMap account.<br>
				<br> This value is <b>REQUIRED</b>
			</td>
		</tr>
		<tr>
			<td><code>units</code></td>
			<td>What units to use. Specified by config.js<br>
				<br><b>Possible values:</b> <code>config.units</code> = Specified by config.js, <code>default</code> = Kelvin, <code>metric</code> = Celsius, <code>imperial</code> =Fahrenheit
				<br><b>Default value:</b> <code>config.units</code>
			</td>
		</tr>
		<tr>
			<td><code>maxNumberOfDays</code></td>
			<td>How many days of forecast to return. Specified by config.js<br>
				<br><b>Possible values:</b> <code>1</code> - <code>16</code>
				<br><b>Default value:</b> <code>7</code> (7 days)
				<br>This value is optional. By default the weatherforecast module will return 7 days.
			</td>
		</tr>
		<tr>
			<td><code>updateInterval</code></td>
			<td>How often does the content needs to be fetched? (Milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code> - <code>86400000</code>
				<br><b>Default value:</b> <code>300000</code> (10 minutes)
			</td>
		</tr>
		<tr>
			<td><code>animationSpeed</code></td>
			<td>Speed of the update animation. (Milliseconds)<br>
				<br><b>Possible values:</b><code>0</code> - <code>5000</code>
				<br><b>Default value:</b> <code>2000</code> (2 seconds)
			</td>
		</tr>

		<tr>
			<td><code>lang</code></td>
			<td>The language of the days.<br>
				<br><b>Possible values:</b> <code>en</code>, <code>nl</code>, <code>ru</code>, etc ...
				<br><b>Default value:</b> uses value of <i>config.language</i>
			</td>
		</tr>
		<tr>
			<td><code>fade</code></td>
			<td>Fade the future events to black. (Gradient)<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>fadePoint</code></td>
			<td>Where to start fade?<br>
				<br><b>Possible values:</b> <code>0</code> (top of the list) - <code>1</code> (bottom of list)
				<br><b>Default value:</b> <code>0.25</code>
			</td>
		</tr>
		<tr>
			<td><code>initialLoadDelay</code></td>
			<td>The initial delay before loading. If you have multiple modules that use the same API key, you might want to delay one of the requests. (Milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code> - <code>5000</code>
				<br><b>Default value:</b>  <code>0</code>
			</td>
		</tr>
		<tr>
			<td><code>retryDelay</code></td>
			<td>The delay before retrying after a request failure. (Milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code> - <code>60000</code>
				<br><b>Default value:</b>  <code>2500</code>
			</td>
		</tr>
		<tr>
			<td><code>apiVersion</code></td>
			<td>The OpenWeatherMap API version to use.<br>
				<br><b>Default value:</b>  <code>2.5</code>
			</td>
		</tr>
		<tr>
			<td><code>apiBase</code></td>
			<td>The OpenWeatherMap base URL.<br>
				<br><b>Default value:</b>  <code>'http://api.openweathermap.org/data/'</code>
			</td>
		</tr>
		<tr>
			<td><code>weatherEndpoint</code></td>
			<td>The OpenWeatherMap API endPoint.<br>
				<br><b>Default value:</b>  <code>'forecast/daily'</code>
			</td>
		</tr>
		<tr>
			<td><code>iconTable</code></td>
			<td>The conversion table to convert the weather conditions to weather-icons.<br>
				<br><b>Default value:</b>  <code>iconTable: {
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
		}</code>
			</td>
		</tr>

	</tbody>
</table>
