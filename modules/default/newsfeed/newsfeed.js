/* global Module */

/* Magic Mirror
 * Module: NewsFeed
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("newsfeed",{

	// Default module config.
	defaults: {
		feedUrl: "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml",
		showPublishDate: true,
		reloadInterval:  5 * 60 * 1000, // every 5 minutes
		updateInterval: 7.5 * 1000,
		animationSpeed: 2.5 * 1000,
		encoding: "UTF-8" //ISO-8859-1
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.newsItems = [];
		this.loaded = false;
		this.activeItem = 0;

		this.fetchNews();

	},

	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "NEWS_ITEMS") {
			if (payload.url === this.config.feedUrl) {
				this.newsItems = payload.items;
				if (!this.loaded) {
					this.scheduleUpdateInterval();
				}

				this.loaded = true;
			}
		}
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		// wrapper.className = "small";
		// for (var n in this.newsItems) {
		// 	var item = this.newsItems[n];
		// 	wrapper.innerHTML += item.title + '<br>';
		// }
		// return wrapper;

		if (this.activeItem >= this.newsItems.length) {
			this.activeItem = 0;
		}

		if (this.newsItems.length > 0) {

			if (this.config.showPublishDate) {
				var timestamp = document.createElement("div");
				timestamp.className = "light small dimmed";
				timestamp.innerHTML = this.capitalizeFirstLetter(moment(new Date(this.newsItems[this.activeItem].pubdate)).fromNow() + ":");
				//timestamp.innerHTML = this.config.feedUrl;
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
		Log.log("Add news feed to fetcher: " + this.config.feedUrl);
		this.sendSocketNotification("ADD_FEED", {
			url: this.config.feedUrl,
			reloadInterval: this.config.reloadInterval,
			encoding: this.config.encoding
		});
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
