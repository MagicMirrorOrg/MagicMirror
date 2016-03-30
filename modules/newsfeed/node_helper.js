
// Load modules.
var request = require('request'); 
var FeedMe = require('feedme');
var validUrl = require('valid-url');
var MMSocket = require('../../js/socketclient.js');
var socket = new MMSocket('newsfeed');

var fetchers = {};

// Register the notification callback.
socket.setNotificationCallback(function(notification, payload) {
	if(notification === 'ADD_FEED') {
		createFetcher(payload.url, payload.reloadInterval);
	}
});

/* createFetcher(url, reloadInterval)
 * Creates a fetcher for a new url if it doesn't exsist yet.
 * Otherwise it reoses the exsisting one.
 *
 * attribute url string - URL of the news feed.
 * attribute reloadInterval number - Reload interval in milliseconds.
 */

var createFetcher = function(url, reloadInterval) {
	if (!validUrl.isUri(url)){
        socket.sendNotification('INCORRECT_URL', url);
        return;
    }

    var fetcher;
    if (typeof fetchers[url] === 'undefined') {
    	console.log('Create new news fetcher for url: ' + url + ' - Interval: ' + reloadInterval);
    	fetcher = new Fetcher(url, reloadInterval);
    	fetchers[url] = fetcher;
    } else {
    	console.log('Use exsisting news fetcher for url: ' + url);
    	fetcher = fetchers[url];
    	fetcher.setReloadInterval(reloadInterval);
    	fetcher.broadcastItems();
    }

    fetcher.startFetch();
};


/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute url string - URL of the news feed.
 * attribute reloadInterval number - Reload interval in milliseconds.
 */

var Fetcher = function(url, reloadInterval) {
	var self = this;
	var newsFetcher = new NewsFetcher();
	if (reloadInterval < 1000) {
		reloadInterval = 1000;
	}
	
	var reloadTimer = null;
	var items = [];

	/* private methods */

	/* fetchNews()
	 * Request the new items from the newsFetcher.
	 */

	var fetchNews = function() {
		//console.log('Fetch news.');
		clearTimeout(reloadTimer);
		reloadTimer = null;
		newsFetcher.fetchNews(url, function(fetchedItems) {
			//console.log(fetchedItems.length + ' items received.');
			items = fetchedItems;
			self.broadcastItems();
			scheduleTimer();
		}, function(error) {
			//console.log('Unable to load news: ' + error);
			socket.sendNotification('UNABLE_TO_LOAD_NEWS', {url:url, error:error});
			scheduleTimer();
		});
	};

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */

	var scheduleTimer = function() {
		//console.log('Schedule update timer.');
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function() {
			fetchNews();
		}, reloadInterval);
	};

	/* public methods */

	/* setReloadInterval()
	 * Update the reload interval, but only if we need to increase the speed.
	 *
	 * attribute interval number - Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function(interval) {
		if (interval > 1000 && interval < reloadInterval) {
			reloadInterval = interval;
		}
	};

	/* startFetch()
	 * Initiate fetchNews();
	 */
	this.startFetch = function() {
		fetchNews();
	};

	/* broadcastItems()
	 * Broadcast the exsisting items.
	 */
	this.broadcastItems = function() {
		if (items.length <= 0) {
			//console.log('No items to broadcast yet.');
			return;
		}
		//console.log('Broadcasting ' + items.length + ' items.');
		socket.sendNotification('NEWS_ITEMS', {
			url: url,
			items: items
		});
	};
};

/* NewsFetcher
 * Responsible for requesting retrieving the data.
 */

var NewsFetcher = function() {
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

	parser.on('error', function(error) {
		self.errorCallback(error);
	});

	/* public methods */

	/* fetchNews()
	 * Fetch the new news items.
	 *
	 * attribute url string - The url to fetch.
	 * attribute success function(items) - Callback on succes. 
	 * attribute error function(error) - Callback on error. 
	 */
	self.fetchNews = function(url, success, error) {
		self.successCallback = success;
		self.errorCallback = error;
		request(url).pipe(parser);
	};
};




 

