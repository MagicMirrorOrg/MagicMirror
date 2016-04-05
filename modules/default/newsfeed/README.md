# Module: News Feed
The `newsfeed ` module is one of the default modules of the MagicMirror.
This module displays news headlines based on an RSS feed.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'newsfeed',
		position: 'bottom_bar',	// This can be any of the regions. Best results in center regions.
		config: {
			// The config property is optional.
			// If no config is set, an example calendar is shown.
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
			<td><code>feedUrl</code></td>
			<td>The url of the feed used for the headlines.<br>
				<br><b>Default value:</b> <code>'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml'</code>
			</td>
		</tr>

		<tr>
			<td><code>showPublishDate</code></td>
			<td>Display the publish date of an headline.<br>
				<br><b>Default value:</b> <code>true</code>
				<br><b>Default value:</b> <code>true</code> or <code>false</code>
			</td>
		</tr>

		<tr>
			<td><code>reloadInterval</code></td>
			<td>How often does the content needs to be fetched? (Milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code> - <code>86400000</code>
				<br><b>Default value:</b> <code>300000</code> (5 minutes)
			</td>
		</tr>
		<tr>
			<td><code>updateInterval</code></td>
			<td>How often do you want to display a new headline? (Milliseconds)<br>
				<br><b>Possible values:</b><code>1000</code> - <code>60000</code>
				<br><b>Default value:</b> <code>7500</code> (7.5 seconds)
			</td>
		</tr>
		<tr>
			<td><code>animationSpeed</code></td>
			<td>Speed of the update animation. (Milliseconds)<br>
				<br><b>Possible values:</b><code>0</code> - <code>5000</code>
				<br><b>Default value:</b> <code>2000</code> (2.5 seconds)
			</td>
		</tr>
		<tr>
			<td><code>encoding</code></td>
			<td>The encoding of the news feed.<br>
				<br><b>Possible values:</b><code>'UTF-8'</code>, <code>'ISO-8859-1'</code>, etc ...
				<br><b>Default value:</b> <code>'UTF-8'</code> 
			</td>
		</tr>

	</tbody>
</table>
