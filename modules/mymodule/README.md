# Module: My Module
Description

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: "mymodule",
		position: "bottom_bar",	// This can be any of the regions.
		config: {
			// See 'Configuration options' for more information.
			text: "Hello world!"
		}
	}
]
````

## Configuration options

The following properties can be configured:

| Option | Description
| ------ | -----------
| `text` | The text to display. <br><br> **Example:** `'Hello world!'` <br> **Default value:** `'Hello world!'`
