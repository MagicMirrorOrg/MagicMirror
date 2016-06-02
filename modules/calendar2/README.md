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
						// Please see the 'Configuration Options' below for more information
				}
			}
]
````