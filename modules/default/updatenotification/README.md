# Module: Update Notification
The `updatenotification` module is one of the default modules of the MagicMirror.
This will display a message whenever a new version of the MagicMirror application is available.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: "updatenotification",
		position: "top_center",	// This can be any of the regions.
		config: {
			// The config property is optional.
			// See 'Configuration options' for more information.
		}
	}
]
````

## Configuration options

The following properties can be configured:

| Option           | Description
| ---------------- | -----------
| `updateInterval` | How often do you want to check for a new version? This value represents the interval in milliseconds. <br><br> **Possible values:** Any value above `60000` (1 minute) <br> **Default value:** `600000` (10 minutes);
