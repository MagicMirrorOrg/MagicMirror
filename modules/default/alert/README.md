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
			<td>The animation effect to use for notifications.<br>
				<br><b>Possible values:</b> <code>scale</code> <code>slide</code> <code>genie</code> <code>jelly</code> <code>flip</code> <code>exploader</code> <code>bouncyflip</code>
				<br><b>Default value:</b> <code>slide</code>
			</td>
		</tr>
		<td><code>alert_effect</code></td>
			<td>The animation effect to use for alerts.<br>
				<br><b>Possible values:</b> <code>scale</code> <code>slide</code> <code>genie</code> <code>jelly</code> <code>flip</code> <code>exploader</code> <code>bouncyflip</code>
				<br><b>Default value:</b> <code>jelly</code>
			</td>
		</tr>
		<tr>
			<td><code>display_time</code></td>
			<td>Time a notification is displayed in seconds.<br>
				<br><b>Possible values:</b> <code>float</code> <code>int</code>
				<br><b>Default value:</b> <code>3.5</code>
			</td>
		</tr>
		<tr>
		<tr>
			<td><code>position</code></td>
			<td>Position where the notifications should be displayed.<br>
				<br><b>Possible values:</b> <code>left</code> <code>center</code> <code>right</code>
				<br><b>Default value:</b> <code>center</code>
			</td>
		</tr>
		<tr>
			<td><code>welcome_message</code></td>
			<td>Message shown at startup.<br>
				<br><b>Possible values:</b> <code>string</code> <code>false</code>
				<br><b>Default value:</b> <code>Welcome, start was successfull!</code>
			</td>
		</tr>
	</tbody>
</table>


## Developer notes
For notifications use:

```
self.sendNotification("SHOW_ALERT", {type: "notification"}); 
```
For alerts use:

```
self.sendNotification("SHOW_ALERT", {}); 
```

### Notification params
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
			<td>The title of the notification.<br>
				<br><b>Possible values:</b> <code>text</code> or <code>html</code>
			</td>
		</tr>
		<tr>
			<td><code>message</code></td>
			<td>The message of the notification.<br>
				<br><b>Possible values:</b> <code>text</code> or <code>html</code>
			</td>
		</tr>
	</tbody>
</table>

### Alert params
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
				<br><b>Possible values:</b> <code>text</code> or <code>html</code>
			</td>
		</tr>
		<tr>
			<td><code>message</code></td>
			<td>The message of the alert.<br>
				<br><b>Possible values:</b> <code>text</code> or <code>html</code>
			</td>
		</tr>
		<tr>
			<td><code>imageUrl</code> (optional)</td>
			<td>Image to show in the alert<br>
				<br><b>Possible values:</b> <code>url</code> <code>path</code>
				<br><b>Default value:</b> <code>none</code>
			</td>
		</tr>
		<tr>
			<td><code>imageFA</code> (optional)</td>
			<td>Font Awesome icon to show in the alert<br>
				<br><b>Possible values:</b> See <a href="http://fontawesome.io/icons/" target="_blank">Font Awsome</a> website.
				<br><b>Default value:</b> <code>none</code>
			</td>
		</tr>
		<tr>
			<td><code>imageHeight</code> (optional even with imageUrl set)</td>
			<td>Height of the image<br>
				<br><b>Possible values:</b> <code>intpx</code>
				<br><b>Default value:</b> <code>80px</code>
			</td>
		</tr>
		<tr>
			<td><code>timer</code> (optional)</td>
			<td>How long the alert should stay visible in ms.
			<br><b>Important:</b> If you do not use the <code>timer</code>, it is your duty to hide the alert by using <code>self.sendNotification("HIDE_ALERT");</code>!<br>
				<br><b>Possible values:</b> <code>int</code> <code>float</code>
				<br><b>Default value:</b> <code>none</code>
			</td>
		</tr>
	</tbody>
</table>

## Open Source Licenses
###[NotificationStyles](https://github.com/codrops/NotificationStyles)
See [ympanus.net](http://tympanus.net/codrops/licensing/) for license.