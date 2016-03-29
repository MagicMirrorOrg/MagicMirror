// Configuration.
var config = {
	port: 8080
};

// Load modules.
var express = require('express');
var request = require('request'); 
var FeedMe = require('feedme');
var validUrl = require('valid-url');
var app = express();

// Create NewsFetcher.
var NewsFetcher = (function() {
	var self = this;

	self.successCallback = function(){};
	self.errorCallback = function(){};

	self.items = [];

	var parser = new FeedMe();

	parser.on('item', function(item) {
		//console.log(item);
		self.items.push({
			title: item.title,
			pubdate: item.pubdate,
		});
	});

	parser.on('end', function(item) {
		self.successCallback(self.items);
	});

	parser.on('error', function(item) {
		self.errorCallback();
	});

	return {
		fetchNews: function(url, success, error) {
			self.successCallback = success;
			self.errorCallback = error;
			request(url).pipe(parser);
		}
	};
})();

// Create route for fetcher.
app.get('/', function (req, res) {

	if (!validUrl.isUri(req.query.url)){
        res.status(404).send('No valid feed URL.');
        return;
    }

	NewsFetcher.fetchNews(req.query.url, function(items) {
		res.send(items);
	}, function() {
		res.status(400).send('Could not parse feed.');
	});
});

// Listen on port.
app.listen(config.port, function () {
  console.log('Feed proxy is running on port: ' + config.port);
});

console.log('Starting feed proxy on port: ' + config.port);
 


 

