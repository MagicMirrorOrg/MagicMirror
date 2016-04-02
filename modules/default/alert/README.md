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
			// See 'Configuration options' for more information. 
		}
	}
]
```

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
			<td><code>style</code></td>
			<td>The style of the notifications.<br>
				<br><b>Possible values:</b> <code>growl</code>, <code>attached</code> and <code>bar</code>
				<br><b>Default value:</b> <code>growl</code>
			</td>
		</tr>
		<tr>
			<td><code>effect</code></td>
			<td>The animation effect of the notification style to use.<br>
				<br><b>Possible values for <code>growl</code> style:</b> <code>scale</code>, <code>slide</code>, <code>genie</code> and <code>jelly</code>
				<br><b>Possible values for <code>attached</code> style:</b> <code>flip</code> and <code>bouncyflip</code>
				<br><b>Possible values for <code>bar</code> style:</b> <code>slidetop</code> and <code>exploader</code>
				<br><b>Default value:</b> <code>slide</code>
			</td>
		</tr>
		<tr>
			<td><code>display_time</code></td>
			<td>Time a notification is displayed.<br>
				<br><b>Possible values:</b> any <code>int</code>
				<br><b>Default value:</b> <code>3500</code>
			</td>
		</tr>
		<tr>
			<td><code>welcome_message</code></td>
			<td>Message shown at startup.<br>
				<br><b>Possible values:</b> any <code>string</code>
				<br><b>Default value:</b> <code>Welcome, start was successfull!</code>
			</td>
		</tr>
	</tbody>
</table>


## Developer notes
The `message` and the `title` parameters accept text as well as html.

### Display notification
```
self.sendNotification("SHOW_NOTIFICATION", message); 
```

### Display alert
```
self.sendNotification("SHOW_ALERT", {title: "Hello", message: "This is a test!", type: "success", imageUrl:"url", imageSize: "50x50", timer:1000}); 
```
All parameters exept for `title` and `message` are optional. Possible types are `error`, `warning`, `info` and `success`. If you do not use the `timer` parameter, it is your responsibility to manually hide the alert by using `self.sendNotification("HIDE_ALERT");`!

## Open Source Licenses
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