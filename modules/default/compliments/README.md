# Module: Compliments
The `compliments` module is one of the default modules of the MagicMirror.
This module displays a random compliment.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: "compliments",
		position: "lower_third",	// This can be any of the regions.
									// Best results in one of the middle regions like: lower_third
		config: {
			// The config property is optional.
			// If no config is set, the default compliments are shown.
			// See 'Configuration options' for more information.
		}
	}
]
````

## Configuration options

The following properties can be configured:


| Option           | Description
| ---------------- | -----------
| `updateInterval` | How often does the compliment have to change? (Milliseconds) <br><br> **Possible values:** `1000` - `86400000` <br> **Default value:** `30000` (30 seconds)
| `fadeSpeed`      | Speed of the update animation. (Milliseconds) <br><br> **Possible values:**`0` - `5000` <br> **Default value:** `4000` (4 seconds)
| `compliments`	   | The list of compliments. <br><br> **Possible values:** An object with four arrays: `morning`, `afternoon`, `evening` and `anytime`. See _compliment configuration_ below. <br> **Default value:** See _compliment configuration_ below.
| `remoteFile`     | External file from which to load the compliments <br><br> **Possible values:** Path or URL (starting with `http://` or `https://`) to a JSON file containing compliments, configured as per the value of the _compliments configuration_ (see below). An object with four arrays: `morning`, `afternoon`, `evening` and `anytime`. - `compliments.json` <br> **Default value:** `null` (Do not load from file)
| `classes`        | Override the CSS classes of the div showing the compliments <br><br> **Default value:** `thin xlarge bright`
| `morningStartTime`        |  Time in hours (in 24 format), after which the mode of "morning" will begin <br> **Possible values:** `0` - `24` <br><br> **Default value:** `3`
| `morningEndTime`        |  Time in hours (in 24 format), after which the mode of "morning" will end <br> **Possible values:** `0` - `24` <br><br> **Default value:** `12`
| `afternoonStartTime`        | Time in hours (in 24 format), after which the mode "afternoon" will begin <br> **Possible values:** `0` - `24` <br><br>  **Default value:** `12`
| `afternoonEndTime`        | Time in hours (in 24 format), after which the mode "afternoon" will end <br> **Possible values:** `0` - `24` <br><br> **Default value:** `17`

All the rest of the time that does not fall into the morningStartTime-morningEndTime and afternoonStartTime-afternoonEndTime ranges is considered "evening".

### Compliment configuration

The `compliments` property contains an object with four arrays: <code>morning</code>, <code>afternoon</code>, <code>evening</code> and <code>anytime</code>. Based on the time of the day, the compliments will be picked out of one of these arrays. The arrays contain one or multiple compliments.


If use the currentweather is possible use a actual weather for set compliments. The availables properties are:
* `day_sunny`
* `day_cloudy`
* `cloudy`
* `cloudy_windy`
* `showers`
* `rain`
* `thunderstorm`
* `snow`
* `fog`
* `night_clear`
* `night_cloudy`
* `night_showers`
* `night_rain`
* `night_thunderstorm`
* `night_snow`
* `night_alt_cloudy_windy`

#### Example use with currentweather module
````javascript
config: {
	compliments: {
		day_sunny: [
			"Today is a sunny day",
			"It's a beautiful day"
		],
		snow: [
			"Snowball battle!"
		],
		rain: [
			"Don't forget your umbrella"
		]
	}
}
````


#### Default value:
````javascript
config: {
	compliments: {
		anytime: [
			"Hey there sexy!"
		],
		morning: [
			"Good morning, handsome!",
			"Enjoy your day!",
			"How was your sleep?"
		],
		afternoon: [
			"Hello, beauty!",
			"You look sexy!",
			"Looking good today!"
		],
		evening: [
			"Wow, you look hot!",
			"You look nice!",
			"Hi, sexy!"
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
    "anytime" : [
        "Hey there sexy!"
    ],
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

