# Module: Compliments
The `compliments` module is one of the default modules of the MagicMirror.
This module displays a random compliment.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'compliments',
		position: 'lower_third',	// This can be any of the regions.
									// Best results in one of the middle regions like: lower_third
		config: {
			// The config property is optional.
			// If no config is set, an example calendar is shown.
			// See 'Configuration options' for more information.
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
			<td><code>updateInterval</code></td>
			<td>How often does the compliment have to change? (Milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code> - <code>86400000</code>
				<br><b>Default value:</b> <code>30000</code> (30 seconds)
			</td>
		</tr>
		<tr>
			<td><code>fadeSpeed</code></td>
			<td>Speed of the update animation. (Milliseconds)<br>
				<br><b>Possible values:</b><code>0</code> - <code>5000</code>
				<br><b>Default value:</b> <code>4000</code> (4 seconds)
			</td>
		</tr>
		<tr>
			<td><code>compliments</code></td>
			<td>The list of compliments.<br>
				<br><b>Possible values:</b> An object with three arrays: <code>morning</code>, <code>afternoon</code> and<code>evening</code>. See <i>compliment configuration</i> below.
				<br><b>Default value:</b> See <i>compliment configuration</i> below.
			</td>
		</tr>
		<tr>
			<td><code>remoteFile</code></td>
			<td>External file from which to load the compliments<br>
				<br><b>Possible values:</b>Path to a JSON file containing compliments, configured
				as per the value of the <i>compliments configuration</i> (see below). An object with three arrays:
				morning, afternoon and evening. - <code>compliments.json</code>
				<br><b>Default value:</b> <code>null</code> (Do not load from file)
			</td>
		</tr>
	</tbody>
</table>

### Compliment configuration

The `compliments` property contains an object with three arrays: <code>morning</code>, <code>afternoon</code> and<code>evening</code>. Based on the time of the day, the compliments will be picked out of one of these arrays. The arrays contain one or multiple compliments.


If use the currentweather is possible use a actual weather for set compliments. The availables properties are:
* <code>day_sunny</code>
* <code>day_cloudy</code>
* <code>cloudy</code>
* <code>cloudy_windy</code>
* <code>showers</code>
* <code>rain</code>
* <code>thunderstorm</code>
* <code>snow</code>
* <code>fog</code>
* <code>night_clear</code>
* <code>night_cloudy</code>
* <code>night_showers</code>
* <code>night_rain</code>
* <code>night_thunderstorm</code>
* <code>night_snow</code>
* <code>night_alt_cloudy_windy</code>

#### Example use with currentweather module
````javascript
config: {
	compliments: {
		day_sunny: [
			'Today is a sunny day',
			'It\'s a beautiful day'
		],
		snow: [
			'Snowball battle!'
		],
		rain: [
			'Don\'t forget your umbrella'
		]
	}
}
````


#### Default value:
````javascript
config: {
	compliments: {
		morning: [
			'Good morning, handsome!',
			'Enjoy your day!',
			'How was your sleep?'
		],
		afternoon: [
			'Hello, beauty!',
			'You look sexy!',
			'Looking good today!'
		],
		evening: [
			'Wow, you look hot!',
			'You look nice!',
			'Hi, sexy!'
		]
	}
}
````

### External Compliment File
You may specify an external file that contains the three compliment arrays. This is particularly useful if you have a
large number of compliments and do not wish to crowd your `config.js` file with a large array of compliments.
Adding the `remoteFile` variable will override an array you specify in the configuration file.

This file must be straight JSON. Note that the array names need quotes
around them ("morning", "afternoon", "evening", "snow", "rain", etc.).
#### Example compliments.json file:
````json
{
    "morning" : [
        "Good morning, sunshine!",
        "Who needs coffee when you have your smile?",
        "Go get 'em, Tiger!"
    ],
    "afternoon" : [
        "Hitting your stride!",
        "You are making a difference!",
        "You're more fun than bubble wrap!"
    ],
    "evening" : [
        "You made someone smile today, I know it.",
        "You are making a difference.",
        "The day was better for your efforts."
    ]
}
````

