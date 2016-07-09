# Module: Clock
The `clock` module is one of the default modules of the MagicMirror.
This module displays the current date and time. The information will be updated realtime.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'clock',
		position: 'top_left',	// This can be any of the regions.
		config: {
			// The config property is optional.
			// See 'Configuration options' for more information.
		}
	}
]
````

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
			<td><code>timeFormat</code></td>
			<td>Use 12 or 24 hour format.<br>
				<br><b>Possible values:</b> <code>12</code> or <code>24</code>
				<br><b>Default value:</b> uses value of <i>config.timeFormat</i>
			</td>
		</tr>
		<tr>
			<td><code>displaySeconds</code></td>
			<td>Display seconds.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>showPeriod</code></td>
			<td>Show the period (am/pm) with 12 hour format.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>showPeriodUpper</code></td>
			<td>Show the period (AM/PM) with 12 hour format as uppercase.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>clockBold</code></td>
			<td>Remove the colon and bold the minutes to make a more modern look.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>displayType</code></td>
			<td>Display a digital clock, analog clock, or both together.<br>
				<br><b>Possible values:</b> <code>digital</code>, <code>analog</code>, or <code>both</code>
				<br><b>Default value:</b> <code>digital</code>
			</td>
		</tr>
		<tr>
			<td><code>analogSize</code></td>
			<td>**Specific to the analog clock** Defines how large the analog display is.<br>
				<br><b>Possible values:</b> A positive number of pixels</code>
				<br><b>Default value:</b> <code>200px</code>
			</td>
		</tr>
		<tr>
			<td><code>analogFace</code></td>
			<td>**Specific to the analog clock** Specifies which clock face to use.<br>
				<br><b>Possible values:</b> <code>false</code> for a default border, <code>none</code> for no face or border, or <code>face-###</code> (where ### is currently a value between 001 and 008, inclusive)
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>secondsColor</code></td>
			<td>**Specific to the analog clock** Specifies what color to make the 'seconds' hand.<br>
				<br><b>Possible values:</b> <code>any HTML RGB Color</code>
				<br><b>Default value:</b> <code>#888888</code>
			</td>
		</tr>
		<tr>
			<td><code>analogPlacement</code></td>
			<td>**Specific to the analog clock** *(requires displayType set to <code>'both'</code>)* Specifies where the analog clock is in relation to the digital clock<br>
				<br><b>Possible values:</b> <code>top</code>, <code>right</code>, <code>bottom</code>, or <code>left</code>
				<br><b>Default value:</b> <code>bottom</code>
			</td>
		</tr>
	</tbody>
</table>
