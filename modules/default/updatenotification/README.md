# Module: Update Notification
The `updatenotification` module is one of the default modules of the MagicMirror.
This will display a message whenever a new version of the MagicMirror application is available.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'updatenotification',
		position: 'top_center',	// This can be any of the regions.
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
			<td><code>updateInterval</code></td>
			<td>How often do you want to check for a new version? This value represents the interval in milliseconds.<br>
				<br><b>Possible values:</b> Any value above <code>60000</code> (1 minute);
				<br><b>Default value:</b> <code>600000</code> (10 minutes);
			</td>
		</tr>
	</tbody>
</table>