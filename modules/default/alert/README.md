# Module: Alert
The alert module is one of the default modules of the MagicMirror. This module displays notifications from other modules.

## Usage
To use this module, add it to the modules array in the config/config.js file:

```
modules: [
	{
		module: 'alert',
		config: {
			// The config property is optional.
			// layout type: growl|attached|bar|other
			layout: "growl",
			// effects for the specified layout:
			// for growl layout: scale|slide|genie|jelly
			// for attached layout: flip|bouncyflip
			// for bar layout: slidetop|exploader
			effect: "slide",
			//shown at startup
			welcome_message: "Welcome, start was successfull!"
		}
	}
]
```

As a developer your module can send an alert to this module by using:
```
self.sendNotification("SHOW_ALERT", {message: "Hello!"}); 
```