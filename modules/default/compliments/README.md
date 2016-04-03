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
	</tbody>
</table>

### Compliment configuration

The `compliments` property contains an object with three arrays: <code>morning</code>, <code>afternoon</code> and<code>evening</code>. Based on the time of the day, the compliments will be picked out of one of these arrays. The arrays contain one or multiple compliments.

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
