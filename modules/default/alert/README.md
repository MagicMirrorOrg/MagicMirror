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
##Developer notes
The `message` and the `title` parameters accept text as well as html.

###Display notification
```
self.sendNotification("SHOW_NOTIFICATION", message); 
```

###Display alert
```
self.sendNotification("SHOW_ALERT", {title: "Hello", message: "This is a test!", type: "success", imageUrl:"url", imageSize: "50x50", timer:1000}); 
```
All parameters exept for `title` and `message` are optional. Possible types are `error`, `warning`, `info` and `success`. If you do not use the `timer` parameter, it is your responsibility to manually hide the alert by using `self.sendNotification("HIDE_ALERT");`!