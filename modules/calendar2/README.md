# Module: Calendar2
The `calendar2` module is (currently) a simple month view calendar.

## Using the module
To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
			{
				module: 'calendar2',
				position: 'top_left',
				config: {
						// The config property is optional
						// Without a config, a default month view is shown
						// Please see the 'Configuration Options' section for more information
				}
			}
]
````

## Configuration options
The `calendar2` module has several optional properties that can be used to change its behaviour:

<table>
	<thead>
		<tr>
			<th>Option</th>
			<th>Description</th>
			<th>Default</th>
		</tr>
	</thead>
	<tfoot>
		<tr>
			<th>&nbsp;</th>
		</tr>
	</tfoot>
	<tbody>
		<tr>
			<td><code>showHeader</code></td>
			<td>This allows you to turn on or off the header on the calendar.
			    The header consists of the month and year.</td>
			<td><code>true</code></td>
		</tr>
		<tr>
			<td><code>cssStyle</code></td>
			<td>Calendar2 allows you to use a custom CSS to style your calendar, or
			    you can use one of the built-in ones. Please read the 'CSS Styling'
				section for more information.</td>
			<td><code>default</code> Other options are `block` and `custom`. Others
			    may be added in the future.</td>
		</tr>
	</tbody>
</table>

## Custom CSS Styling
