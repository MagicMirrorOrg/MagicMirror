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
			<td><code>effect</code></td>
			<td>The animation effect to use.<br>
				<br><b>Possible values:</b> <code>scale</code>, <code>slide</code>, <code>genie</code>, <code>jelly</code>, <code>flip</code>, <code>exploader</code> & <code>bouncyflip</code>
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
				<br><b>Possible values:</b> any <code>string</code> & <code>false</code>
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
			<td><code>title</code></td>
			<td>The title of the alert.<br>
				<br><b>Possible values:</b> <code>text</code> or <code>html</code> as a  <code>string</code>
			</td>
		</tr>
		<tr>
			<td><code>message</code></td>
			<td>The message of the alert.<br>
				<br><b>Possible values:</b> <code>text</code> or <code>html</code> as a  <code>string</code>
			</td>
		</tr>
		<tr>
			<td><code>type</code> (optional)</td>
			<td>The type of the alert.<br>
				<br><b>Possible values:</b> <code>error</code>, <code>warning</code>, <code>info</code> & <code>success</code>
				<br><b>Default value:</b> <code>none</code>
			</td>
		</tr>
		<tr>
			<td><code>imageUrl</code> (optional)</td>
			<td>Image to show in the alert<br>
				<br><b>Possible values:</b> <code>url</code> as <code>string</code>
				<br><b>Default value:</b> <code>none</code>
			</td>
		</tr>
		<tr>
			<td><code>imageSize</code> (optional even with imageUrl set)</td>
			<td>Size of the image<br>
				<br><b>Possible values:</b> "<code>width</code>x<code>height</code>" as <code>string</code>
				<br><b>Default value:</b> <code>none</code>
			</td>
		</tr>
		<tr>
			<td><code>timer</code> (optional)</td>
			<td>How long the alert should stay visible.<br>
				<br><b>Possible values:</b> any <code>int</code>
				<br><b>Default value:</b> <code>none</code>
				<br><b>Important:</b> If you do not use the `timer`, it is your duty to hide the alert by using <code>self.sendNotification("HIDE_ALERT");</code>!
			</td>
		</tr>
	</tbody>
</table>



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