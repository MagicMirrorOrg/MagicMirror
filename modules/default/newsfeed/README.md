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

			feeds: [
				{
					title: "New York Times",
					url: "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml",
				},
				{
					title: "BBC",
					url: "http://feeds.bbci.co.uk/news/video_and_audio/news_front_page/rss.xml?edition=uk",
				},
			]
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
			<td><code>feeds</code></td>
			<td>An array of feed urls that will be used as source.<br>
				More info about this object can be found below.
				<br><b>Default value:</b> <code>[
					{
						title: "New York Times",
						url: "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml",
					}
				]</code>
			</td>
		</tr>

		<tr>
			<td><code>showSourceTitle</code></td>
			<td>Display the title of the source.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>showPublishDate</code></td>
			<td>Display the publish date of an headline.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>showDescription</code></td>
			<td>Display the description of an item.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>false</code>
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
				<br><b>Default value:</b> <code>10000</code> (10 seconds)
			</td>
		</tr>
		<tr>
			<td><code>animationSpeed</code></td>
			<td>Speed of the update animation. (Milliseconds)<br>
				<br><b>Possible values:</b><code>0</code> - <code>5000</code>
				<br><b>Default value:</b> <code>2000</code> (2 seconds)
			</td>
		</tr>
		<tr>
			<td><code>maxNewsItems</code></td>
			<td>Total amount of news items to cycle through. (0 for unlimited)<br>
				<br><b>Possible values:</b><code>0</code> - <code>...</code>
				<br><b>Default value:</b> <code>0</code>
			</td>
		</tr>
			removeStartTags: false,
		removeEndTags: false,
		startTags: [],
		endTags: []
		
		
		<tr>
			<td><code>removeStartTags</code></td>
			<td>Some newsfeeds feature tags at the <B>beginning</B> of their titles or descriptions, such as <em>[VIDEO]</em>.
			This setting allows for the removal of specified tags from the beginning of an item's description and/or title.<br>
				<br><b>Possible values:</b><code>'title'</code>, <code>'description'</code>, <code>'both'</code> 
			</td>
		</tr>
		<tr>
			<td><code>startTags</code></td>
			<td>List the tags you would like to have removed at the beginning of the feed item<br>
				<br><b>Possible values:</b> <code>['TAG']</code> or <code>['TAG1','TAG2',...]</code>
			</td>
		</tr>
		<tr>
			<td><code>removeEndTags</code></td>
			<td>Remove specified tags from the <B>end</B> of an item's description and/or title.<br>
				<br><b>Possible values:</b><code>'title'</code>, <code>'description'</code>, <code>'both'</code> 
			</td>
		</tr>
		<tr>
			<td><code>endTags</code></td>
			<td>List the tags you would like to have removed at the end of the feed item<br>
				<br><b>Possible values:</b> <code>['TAG']</code> or <code>['TAG1','TAG2',...]</code>
			</td>
		</tr>
	</tbody>
</table>

The `feeds` property contains an array with multiple objects. These objects have the following properties:

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
			<td>The name of the feed source to be displayed above the news items.<br>
				<br>This property is optional.
			</td>
		</tr>

		<tr>
			<td><code>url</code></td>
			<td>The url of the feed used for the headlines.<br>
				<br><b>Example:</b> <code>'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml'</code>
			</td>
		</tr>
		<tr>
			<td><code>encoding</code></td>
			<td>The encoding of the news feed.<br>
				<br>This property is optional.
				<br><b>Possible values:</b><code>'UTF-8'</code>, <code>'ISO-8859-1'</code>, etc ...
				<br><b>Default value:</b> <code>'UTF-8'</code> 
			</td>
		</tr>

	</tbody>
</table>
