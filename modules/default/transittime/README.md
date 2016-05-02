# Module: Transit Time
The `transittime` module is used to calculate driving time from an origin to a destination to help you get to work on time. 

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'default/transittime',
		position: 'top_left',	// This can be any of the regions.
		config: {
			origin: "Ballast Point Brewing and Spirits, Carroll Way, San Diego, CA",
			destination: "Ballast Point, Old Grove Road, San Diego, CA"
		}
	}
]
````

## ToDo

-  Allow directions based on different modes of transportation
