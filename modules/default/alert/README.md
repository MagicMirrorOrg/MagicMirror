# Module: Alert
The alert module is one of the default modules of the MagicMirror. This module displays notifications from other modules.

## Usage
To use this module, add it to the modules array in the config/config.js file:

```
modules: [
	{
		module: "alert",
		config: {
			// The config property is optional.
			// See 'Configuration options' for more information.
		}
	}
]
```

## Configuration options

The following properties can be configured:


| Option            | Description
| ----------------- | -----------
| `effect`          | The animation effect to use for notifications. <br><br> **Possible values:** `scale` `slide` `genie` `jelly` `flip` `exploader` `bouncyflip` <br> **Default value:** `slide`
| `alert_effect`    | The animation effect to use for alerts. <br><br> **Possible values:** `scale` `slide` `genie` `jelly` `flip` `exploader` `bouncyflip` <br> **Default value:** `jelly`
| `display_time`    | Time a notification is displayed in milliseconds. <br><br> **Possible values:** `int` <br> **Default value:** `3500`
| `position`        | Position where the notifications should be displayed. <br><br> **Possible values:** `left` `center` `right` <br> **Default value:** `center`
| `welcome_message` | Message shown at startup. <br><br> **Possible values:** `string` `false` <br> **Default value:** `false` (no message at startup)


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
| Option    | Description
| --------- | -----------
| `title`   | The title of the notification. <br><br> **Possible values:** `text` or `html`
| `message`	| The message of the notification. <br><br> **Possible values:** `text` or `html`


### Alert params
| Option                                          | Description
| ----------------------------------------------- | -----------
| `title`                                         | The title of the alert. <br><br> **Possible values:** `text` or `html`
| `message`                                       | The message of the alert. <br><br> **Possible values:** `text` or `html`
| `imageUrl` (optional)                           | Image to show in the alert <br><br> **Possible values:** `url` `path` <br> **Default value:** `none`
| `imageFA` (optional)                            | Font Awesome icon to show in the alert <br><br> **Possible values:** See [Font Awsome](http://fontawesome.io/icons/) website. <br> **Default value:** `none`
| `imageHeight` (optional even with imageUrl set) | Height of the image <br><br> **Possible values:** `intpx` <br> **Default value:** `80px`
| `timer` (optional)                              | How long the alert should stay visible in ms. <br> **Important:** If you do not use the `timer`, it is your duty to hide the alert by using `self.sendNotification("HIDE_ALERT");`! <br><br>**Possible values:** `int` `float` <br> **Default value:** `none`

## Open Source Licenses
### [NotificationStyles](https://github.com/codrops/NotificationStyles)
See [ympanus.net](http://tympanus.net/codrops/licensing/) for license.
