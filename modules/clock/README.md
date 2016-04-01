# Module: Clock
The `clock` module is one of the default modules of the MagicMirror.
This module displays the current date and time. The information will be updated realtime.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'clock',
		position: 'top_left',	// This can be any of the regions.
		config: {
			// The config property is optional.
			// See 'Configuration options' for more information. 
		}
	}
]
````

## Configuration options

The following properties can be configured:

<table>
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th>Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>timeFormat</code></td>
			<td>Use 12 of 24 hour format.<br>
				<br><b>Possible values:</b>
				<br><b>Default value:</b>
			</td>
		</tr>
		<tr>
			<td><code>displaySeconds</code></td>
			<td>Display seconds.<br>
				<br><b>Possible values: <code>true</code> or <code>false</code></b>
				<br><b>Default value: <code>true</code></b>
			</td>
		</tr>
	</tbody>
</table>
