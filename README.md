# MagicMirror²

[![Dependency Status](https://david-dm.org/MichMich/MagicMirror/v2-beta.svg)](https://david-dm.org/MichMich/MagicMirror/v2-beta)
[![devDependency Status](https://david-dm.org/MichMich/MagicMirror/v2-beta/dev-status.svg)](https://david-dm.org/MichMich/MagicMirror/v2-beta#info=devDependencies)

This version of the Magic Mirror software focusses on a modular plugin system. Besides that, the MagicMirror² software now also uses [Electron](http://electron.atom.io/), so no more webserver or browser installs necessary.

**WARNING!** This version is in a *very* early stage. It is **not** completed yet. **Please** use the master branch.

## Table of contents

- [Usage](#usage)
- [Configuration](#configuration)
- [Modules](#modules)
- [Todo List](#todo-list)
- [Contributing Guidelines](#contributing-guidelines)

## Usage 

#### Automatic Installer (Raspberry Pi Only!)

Execute the following command on your Raspberry Pi to install MagicMirror²:
````
curl -sL https://raw.githubusercontent.com/MichMich/MagicMirror/v2-beta/installers/raspberry.sh | bash
````

#### Manual Installation

1. Download and install the latest Node.js version.
2. Clone the repository and check out the beta branch: `git clone -b v2-beta https://github.com/MichMich/MagicMirror`
3. Enter the repository: `cd ~/MagicMirror`
4. Install and run the app: `npm install && npm start` (You may have to restart your terminal before this works!)

**Important:** `npm start` does **not** work via SSH, use `DISPLAY=:0 nohup npm start &` instead. This starts the mirror on the remote display.

#### Server only

In some cases, you want to start the application without an actual app window. In this case, exectute the following command from the MagicMirror folder: `node serveronly`. This will start the server, after which you can open the application in your browser of choice.

## Configuration

1. Duplicate `config/config.js.sample` to `config/config.js`.
2. Modify your required settings.

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
			<td><code>port</code></td>
			<td>HThe port on which the MagicMirror² server will run.
				<br><b>Default value:</b> <code>8080</code> 
			</td>
		</tr>
		<tr>
			<td><code>language</code></td>
			<td>The language of the interface. (Note: Not all elements will be translated.)
				<br><b>Possible values:</b><code>en</code>, <code>nl</code>, <code>ru</code>, <code>fr</code>, etc ...
				<br><b>Default value:</b> <code>en</code>
			</td>
		</tr>
		<tr>
			<td><code>timeFormat</code></td>
			<td>The time notation.
				<br><b>Possible values:</b> <code>24</code> or <code>12</code>
				<br><b>Default value:</b> <code>24</code> 
			</td>
		</tr>
		<tr>
			<td><code>modules</code></td>
			<td>An array of of the active modules.<br> The array should contain objects. See <i>module configuration</i> below for more information.
			</td>
		</tr>
	</tbody>
</table>

Module configuration:

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
			<td><code>module</code></td>
			<td>The name of the module. This can also contain the subfolder:
				<br><b>Example:</b> <code>clock</code>
				<br><b>Example:</b> <code>default/calendar</code>
				<br><b>Example:</b> <code>custommodules/mymodule</code>
			</td>
		</tr>
		<tr>
			<td><code>position</code></td>
			<td>The location of the module in which the module will be loaded. 
				<br><b>Possible values:</b><code>top_bar</code>, <code>top_left</code>, <code>top_center</code>, <code>top_right</code>, <code>upper_third</code>, <code>middle_center</code>, <code>lower_third</code>, <code>bottom_left</code>, <code>bottom_center</code>, <code>bottom_right</code>, <code>bottom_bar</code>, <code>fullscreen_above</code>, <code>fullscreen_below</code><br>
				<b>Note:</b> This field is optional, but most modules require this field to be set. Check the documentation of the module for more info.<br>
				<b>Note:</b> Multiple modules with the same position will be ordered based on the order in the config file.
			</td>
		</tr>
		<tr>
			<td><code>classes</code></td>
			<td>Additional classed which are added to the module. 
				<br><b>Note:</b> This field is optional.
			</td>
		</tr>
		<tr>
			<td><code>header</code></td>
			<td>To display a header text above the module, add the header property.
				<br><b>Note:</b> This field is optional.
			</td>
		</tr>
		<tr>
			<td><code>config</code></td>
			<td>An object with the module configuration properties. Check the documentation of the module for more info.<br>
				<b>Note:</b> This field is optional
			</td>
		</tr>
	</tbody>
</table>

Configuration example:

````javascript
var config = {
	port: 8080,
	language: 'en',
	timeFormat: 24,

	modules: [
		{
			module: "helloworld",
			position: "middle_center",
			classes: "large thin bright"
			config: {
				text: "MagicMirror²"
			}
		},
		{
			module: "helloworld",
			position: "lower_third",
			classes: "small"
			config: {
				text: "Hello world!"
			}
		}
	]
};

// See the config.js.sample for additional required code.
````

## Modules

The following modules are installed by default.

- [**Clock**](modules/default/clock)
- [**Calendar**](modules/default/calendar)
- [**Current Weather**](modules/default/currentweather)
- [**Weather Forecast**](modules/default/weatherforecast)
- [**News Feed**](modules/default/newsfeed)
- [**Compliments**](modules/default/compliments)
- [**Hello World**](modules/default/helloworld)
- [**Alert**](modules/default/alert)

The following modules are created by their respective authors.

- **[MMM-FRITZ-Box-Callmonitor by PaViRo](https://github.com/paviro/MMM-FRITZ-Box-Callmonitor)** <br> FRITZ!Box Callmonitor (Display an alert when someone is calling ...)

- **[MMM-Facial-Recognition by PaViRo](https://github.com/paviro/MMM-Facial-Recognition)** <br> Facial recognition and module swapping based on the current user ...

- **[MMM-Wunderlist by PaViRo](https://github.com/paviro/MMM-Wunderlist)** <br> Displays your Wunderlist todos on your mirror ...
 
- **[MMM-wordnik by Vendittelli](https://github.com/SVendittelli/MMM-wordnik)** <br> Get the word of the day, its definition, and origin ...

## Todo List

Here is a list of various things that still have to be implemented or changed.

- [ ] Allow show/hide animations to animate the height. This way, the other modules won't jump around.
- [ ] Allow vertical centering of alerts.
- [ ] Write all the documentation.

## Contributing Guidelines

Contributions of all kinds are welcome, not only in the form of code but also with regards bug reports and documentation.

Please keep the following in mind:

- **Bug Reports**:  Make sure you're running the latest version. If the issue(s) still persist: please open a clearly documented issue with a clear title. 
- **Minor Bug Fixes**: Please send a pull request with a clear explanation of the issue or a link to the isssue it solves.
- **Major Bug Fixes**: please discuss your approach in an GitHub issue before you start to alter a big part of the code.
- **New Features**: please please discuss in a GitHub issue before you start to alter a big part of the code. Without discussion upfront, the pull request will not be accepted / merged.

Thanks for your help in making MagicMirror² better! 
