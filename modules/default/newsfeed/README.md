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

| Option            | Description
| ----------------- | -----------
| `feeds`           | An array of feed urls that will be used as source. <br> More info about this object can be found below. <br> **Default value:** `[{ title: "New York Times", url: "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml", encoding: "UTF-8" }]`
| `showSourceTitle` | Display the title of the source. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `showPublishDate` | Display the publish date of an headline. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `showDescription` | Display the description of an item. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `reloadInterval`  | How often does the content needs to be fetched? (Milliseconds) <br><br> **Possible values:** `1000` - `86400000` <br> **Default value:** `300000` (5 minutes)
| `updateInterval`  | How often do you want to display a new headline? (Milliseconds) <br><br> **Possible values:**`1000` - `60000` <br> **Default value:** `10000` (10 seconds)
| `animationSpeed`  | Speed of the update animation. (Milliseconds) <br><br> **Possible values:**`0` - `5000` <br> **Default value:** `2500` (2.5 seconds)
| `maxNewsItems`    | Total amount of news items to cycle through. (0 for unlimited) <br><br> **Possible values:**`0` - `...` <br> **Default value:** `0`
| `removeStartTags` | Some newsfeeds feature tags at the **beginning** of their titles or descriptions, such as _[VIDEO]_. This setting allows for the removal of specified tags from the beginning of an item's description and/or title. <br><br> **Possible values:**`'title'`, `'description'`, `'both'`
| `startTags`       | List the tags you would like to have removed at the beginning of the feed item <br><br> **Possible values:** `['TAG']` or `['TAG1','TAG2',...]`
| `removeEndTags`   | Remove specified tags from the **end** of an item's description and/or title. <br><br> **Possible values:**`'title'`, `'description'`, `'both'`
| `endTags`         | List the tags you would like to have removed at the end of the feed item <br><br> **Possible values:** `['TAG']` or `['TAG1','TAG2',...]`

The `feeds` property contains an array with multiple objects. These objects have the following properties:

| Option     | Description
| ---------- | -----------
| `title`    | The name of the feed source to be displayed above the news items. <br><br> This property is optional.
| `url`      | The url of the feed used for the headlines. <br><br> **Example:** `'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml'`
| `encoding` | The encoding of the news feed. <br><br> This property is optional. <br> **Possible values:**`'UTF-8'`, `'ISO-8859-1'`, etc ... <br> **Default value:** `'UTF-8'`
