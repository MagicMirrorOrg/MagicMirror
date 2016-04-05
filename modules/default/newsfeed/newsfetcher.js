/* Magic Mirror
 * NewsFetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var FeedMe = require("feedme");
var request = require("request");
var iconv = require("iconv-lite");

var NewsFetcher = function() {
	var self = this;

	self.successCallback = function() {};
	self.errorCallback = function() {};

	self.items = [];

	/* fetchNews()
	 * Fetch the new news items.
	 *
	 * attribute url string - The url to fetch.
	 * attribute success function(items) - Callback on succes.
	 * attribute error function(error) - Callback on error.
	 */
	self.fetchNews = function(url, success, error, encoding) {
		self.successCallback = success;
		self.errorCallback = error;

		var parser = new FeedMe();

		parser.on("item", function(item) {
			self.items.push({
				title: item.title,
				pubdate: item.pubdate,
			});
		});

		parser.on("end", function(item) {
			self.successCallback(self.items);
		});

		parser.on("error", function(error) {
			self.errorCallback(error);
		});

		request({uri: url, encoding: null}).pipe(iconv.decodeStream(encoding)).pipe(parser);
	};
};

module.exports = NewsFetcher;
