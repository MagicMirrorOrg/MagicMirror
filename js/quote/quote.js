// A lot of this code is from the original feedToJson function that was included with this project
// The new code allows for multiple feeds to be used but a bunch of variables and such have literally been copied and pasted into this code and some help from here: http://jsfiddle.net/BDK46/
// The original version can be found here: http://airshp.com/2011/jquery-plugin-feed-to-json/
var quote = {
	feed: config.quote.feed || null,
	quoteLocation: '.quote',
	quoteItems: [],
	seenquoteItem: [],
	_yqURL: 'http://query.yahooapis.com/v1/public/yql',
	_yqlQS: '?format=json&q=select%20*%20from%20rss%20where%20url%3D',
	_cacheBuster: Math.floor((new Date().getTime()) / 1200 / 1000),
	_failedAttempts: 0,
	fetchInterval: config.quote.fetchInterval || 7000000,
	updateInterval: config.quote.interval || 5500,
	fadeInterval: 2000,
	intervalId: null,
	fetchquoteIntervalId: null,
	display: config.display || 'quote'
}

/**
 * Creates the query string that will be used to grab a converted RSS feed into a JSON object via Yahoo
 * @param  {string} feed The original location of the RSS feed
 * @return {string}      The new location of the RSS feed provided by Yahoo
 */
quote.buildQueryString = function (feed) {

	return this._yqURL + this._yqlQS + '\'' + encodeURIComponent(feed) + '\'';

}

/**
 * Fetches the quote for each feed provided in the config file
 */
quote.fetchquote = function () {

	// Reset the quote feed
	this.quoteItems = [];

	this.feed.forEach(function (_curr) {

		var _yqUrlString = this.buildQueryString(_curr);
		this.fetchFeed(_yqUrlString);

	}.bind(this));

}

/**
 * Runs a GET request to Yahoo's service
 * @param  {string} yqUrl The URL being used to grab the RSS feed (in JSON format)
 */
quote.fetchFeed = function (yqUrl) {

	$.ajax({
		type: 'GET',
		datatype:'jsonp',
		url: yqUrl,
		success: function (data) {

			if (data.query.count > 0) {
				this.parseFeed(data.query.results.item);
			} else {
				console.error('No feed results for: ' + yqUrl);
			}

		}.bind(this),
		error: function () {
			// non-specific error message that should be updated
			console.error('No feed results for: ' + yqUrl);
		}
	});

}

/**
 * Parses each item in a single quote feed
 * @param  {Object} data The quote feed that was returned by Yahoo
 * @return {boolean}      Confirms that the feed was parsed correctly
 */
quote.parseFeed = function (data) {

	var _rssItems = [];

	for (var i = 0, count = data.length; i < count; i++) {

		_rssItems.push(data[i].description);

	}

	this.quoteItems = this.quoteItems.concat(_rssItems);

	return true;

}

/**
 * Loops through each available and unseen quote feed after it has been retrieved from Yahoo and shows it on the screen
 * When all quote titles have been exhausted, the list resets and randomly chooses from the original set of items
 * @return {boolean} Confirms that there is a list of quote items to loop through and that one has been shown on the screen
 */
quote.showquote = function () {

	// If all items have been seen, swap seen to unseen
	if (this.quoteItems.length === 0 && this.seenquoteItem.length !== 0) {

		if (this._failedAttempts === 20) {
			console.error('Failed to show a quote story 20 times, stopping any attempts');
			return false;
		}

		this._failedAttempts++;

		setTimeout(function () {
			this.showquote();
		}.bind(this), 3000);

	} else if (this.quoteItems.length === 0 && this.seenquoteItem.length !== 0) {
		this.quoteItems = this.seenquoteItem.splice(0);
	}

	var _location = Math.floor(Math.random() * this.quoteItems.length);

	var _item = quote.quoteItems.splice(_location, 1)[0];

	this.seenquoteItem.push(_item);

	$(this.quoteLocation).updateWithText(_item, this.fadeInterval);

	return true;

}

quote.init = function () {

	if (this.feed === null || (this.feed instanceof Array === false && typeof this.feed !== 'string')) {
		return false;
	} else if (typeof this.feed === 'string') {
		this.feed = [this.feed];
	}
	if(this.display.toLowerCase() == 'quote' || this.display.toLowerCase() == 'both'){
		this.fetchquote();
		this.showquote();
	}
	this.fetchquoteIntervalId = setInterval(function () {
		if(this.display.toLowerCase() == 'quote' || this.display.toLowerCase() == 'both'){
			this.fetchquote()
		}
	}.bind(this), this.fetchInterval)

	this.intervalId = setInterval(function () {
		if(this.display.toLowerCase() == 'quote' || this.display.toLowerCase() == 'both'){
			this.showquote();
		}
	}.bind(this), this.updateInterval);

}