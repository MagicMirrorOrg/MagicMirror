/* global Module */

/* Magic Mirror
 * Module: NewsFeed
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.create({

	// Default module config.
	defaults: {
		feedUrl: 'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml',
		showPublishDate: true,
		reloadInterval:  10 * 60 * 1000, // every 10 minutes
	    updateInterval: 7.5 * 1000, 
        animationSpeed: 2.5 * 1000, 


		proxyUrl: 'http://localhost:8080/?url=',
		initialLoadDelay: 0, // 5 seconds delay. This delay is used to keep the OpenWeather API happy.
		retryDelay: 2500,
	},

	// Define required scripts.
	getScripts: function() {
		return ['moment.js'];
	},

	// Define start sequence.
	start: function() {
		Log.info('Starting module: ' + this.name);

		// Set locale.
		moment.locale(config.language);
		
		this.newsItems = [];
		this.loaded = false;
		this.scheduleFetch(this.config.initialLoadDelay);

		this.fetchTimer = null;
		this.activeItem = 0;
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.activeItem >= this.newsItems.length) {
			this.activeItem = 0;
		}

		if (this.newsItems.length > 0) {
			
			if (this.config.showPublishDate) {
				var timestamp = document.createElement("div");
				timestamp.className = "light small dimmed";
				timestamp.innerHTML = this.capitalizeFirstLetter(moment(new Date(this.newsItems[this.activeItem].pubdate)).fromNow() + ':');
				wrapper.appendChild(timestamp);
			}

			var title = document.createElement("div");
			title.className = "bright medium light";
			title.innerHTML = this.newsItems[this.activeItem].title;
			wrapper.appendChild(title);

		} else {
			wrapper.innerHTML = "Loading news ...";
			wrapper.className = "small dimmed";
		}

		return wrapper;
	},

	/* fetchNews(compliments)
	 * Requests new data from news proxy.
	 */
	fetchNews: function() {
		var url = this.config.proxyUrl + encodeURIComponent(this.config.feedUrl);
		var self = this;	

		var newsRequest = new XMLHttpRequest();
		newsRequest.open("GET", url, true);
		newsRequest.onreadystatechange = function() {
		  if(this.readyState === 4) {
			if(this.status === 200) {
				self.newsItems = JSON.parse(this.response);

				if (!self.loaded) {
					self.scheduleUpdateInterval();
				}

				self.loaded = true;
			} else {
				Log.error(self.name + ": Could not load news.");
			}

			self.scheduleFetch((self.loaded) ? -1 : self.config.retryDelay);
			
		  }
		};
		newsRequest.send();
	},

	/* scheduleUpdateInterval()
	 * Schedule visual update.
	 */
	scheduleUpdateInterval: function() {
		var self = this;

		self.updateDom(self.config.animationSpeed);

		setInterval(function() {
			self.activeItem++;
			self.updateDom(self.config.animationSpeed);
		}, this.config.updateInterval);
	},

	/* scheduleFetch()
	 * Schedule next news fetch.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.reloadInterval is used.
	 */
	scheduleFetch: function(delay) {
		var nextLoad = this.config.reloadInterval;
		if (typeof delay !== 'undefined' && delay >= 0) {
			nextLoad = delay;
		} 

		var self = this;
		clearTimeout(this.fetchTimer);
		this.fetchTimer = setTimeout(function() {
			self.fetchNews();
		}, nextLoad);
	},

	/* capitalizeFirstLetter(string)
	 * Capitalizes the first character of a string.
	 *
	 * argument string string - Input string.
	 *
	 * return string - Capitalized output string.
	 */
	capitalizeFirstLetter: function(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
	}
});


