# Module: Hello World
The `helloworld` module is one of the default modules of the MagicMirror. It is a simple way to display a static text on the mirror.
## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'helloworld',
		position: 'bottom_bar',	// This can be any of the regions.
		config: {
			// See 'Configuration options' for more information.
			text: 'Hello world!'
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
			<td><code>text</code></td>
			<td>The text to display.<br>
				<br><b>Example:</b> <code>'Hello world!'</code>
				<br><b>Default value:</b> <code>'Hello world!'</code>
			</td>
		</tr>
	</tbody>
</table>
