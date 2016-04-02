# Module: Alert
The alert module is one of the default modules of the MagicMirror. This module displays notifications from other modules.

## Usage
To use this module, add it to the modules array in the config/config.js file:

```
modules: [
	{
		module: 'alert',
		config: {
			// style type: growl|attached|bar
			style: "growl",
			// effects for the specified style:
			// for growl style: scale|slide|genie|jelly
			// for attached style: flip|bouncyflip
			// for bar style: slidetop|exploader
			effect: "slide",
			//time a notification is displayed
			display_time: 3500,
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

##Open Source Licenses
###[SweetAlert](http://t4t5.github.io/sweetalert/)
The MIT License (MIT)

Copyright (c) 2014 Tristan Edwards

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

###[NotificationStyles](https://github.com/codrops/NotificationStyles)
See [ympanus.net](http://tympanus.net/codrops/licensing/) for license.