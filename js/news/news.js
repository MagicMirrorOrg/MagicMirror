// A lot of this code is from the original feedToJson function that was included with this project
// The new code allows for multiple feeds to be used but a bunch of variables and such have literally been copied and pasted into this code and some help from here: http://jsfiddle.net/BDK46/
// The original version can be found here: http://airshp.com/2011/jquery-plugin-feed-to-json/
var news = {
	feed: config.news.feed || null,
	newsLocation: '.news',
	newsItems: [],
	seenNewsItem: [],
	_yqURL: 'http://query.yahooapis.com/v1/public/yql',
	_yqlQS: '?format=json&q=select%20*%20from%20rss%20where%20url%3D',
	_cacheBuster: Math.floor((new Date().getTime()) / 1200 / 1000),
	_failedAttempts: 0,
	fetchInterval: config.news.fetchInterval || 60000,
	updateInterval: config.news.interval || 5500,
	fadeInterval: 2000,
	intervalId: null,
	fetchNewsIntervalId: null
}

news.buildQueryString = function (feed) {

	return this._yqURL + this._yqlQS + '\'' + encodeURIComponent(feed) + '\'';

}

news.fetchNews = function () {

	// Reset the news feed
	this.newsItems = [];

	this.feed.forEach(function (_curr) {

		var _yqUrlString = this.buildQueryString(_curr);
		this.fetchFeed(_yqUrlString);

	}.bind(this));

}

news.fetchFeed = function (yqUrl) {

	$.ajax({
		type: 'GET',
		datatype:'jsonp',
		url: yqUrl,
		success: function (data) {

			this.parseFeed(data.query.results.item);

		}.bind(this),
		error: function () {

		}
	});

}

news.parseFeed = function (data) {

	var _rssItems = [];

	for (var i = 0, count = data.length; i < count; i++) {

		_rssItems.push(data[i].title);

	}

	this.newsItems = this.newsItems.concat(_rssItems);

	return true;

}

news.showNews = function () {

	// If all items have been seen, swap seen to unseen
	if (this.newsItems.length === 0 && this.seenNewsItem.length !== 0) {

		if (this._failedAttempts === 20) {
			console.error('Failed to show a news story 20 times, stopping any attempts');
			return false;
		}

		this._failedAttempts++;

		setTimeout(function () {
			this.showNews();
		}.bind(this), 30000);

	} else if (this.newsItems.length === 0 && this.seenNewsItem.length !== 0) {
		this.newsItems = this.seenNewsItem.splice(0);
	}

	var _location = Math.floor(Math.random() * this.newsItems.length);

	var _item = news.newsItems.splice(_location, 1)[0];

	this.seenNewsItem.push(_item);

	$(this.newsLocation).updateWithText(_item, this.fadeInterval);

}

news.init = function () {

	if (this.feed === null || this.feed instanceof Array) {
		return false;
	} else if (typeof this.feed === 'string') {
		this.feed = [this.feed];
	}

	this.fetchNews();
	this.showNews();

	this.fetchNewsIntervalId = setInterval(function () {
		this.fetchNews()
	}.bind(this), this.fetchInterval)

	this.intervalId = setInterval(function () {
		this.showNews();
	}.bind(this), this.updateInterval);

}