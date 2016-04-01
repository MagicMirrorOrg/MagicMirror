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
			<td><code>timeFormat</code></td>
			<td>Use 12 or 24 hour format.<br>
				<br><b>Possible values:</b> <code>12</code> or <code>24</code>
				<br><b>Default value:</b> uses value of <i>config.timeFormat</i>
			</td>
		</tr>
		<tr>
			<td><code>displaySeconds</code></td>
			<td>Display seconds.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
	</tbody>
</table>
