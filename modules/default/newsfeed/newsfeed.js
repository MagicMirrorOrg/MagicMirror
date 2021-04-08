/* Magic Mirror
 * Module: NewsFeed
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("newsfeed", {
	// Default module config.
	defaults: {
		feeds: [
			{
				title: "New York Times",
				url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
				encoding: "UTF-8" //ISO-8859-1
			}
		],
		showSourceTitle: true,
		showPublishDate: true,
		broadcastNewsFeeds: true,
		broadcastNewsUpdates: true,
		showDescription: false,
		wrapTitle: true,
		wrapDescription: true,
		truncDescription: true,
		lengthDescription: 400,
		hideLoading: false,
		reloadInterval: 5 * 60 * 1000, // every 5 minutes
		updateInterval: 10 * 1000,
		animationSpeed: 2.5 * 1000,
		maxNewsItems: 0, // 0 for unlimited
		ignoreOldItems: false,
		ignoreOlderThan: 24 * 60 * 60 * 1000, // 1 day
		removeStartTags: "",
		removeEndTags: "",
		startTags: [],
		endTags: [],
		prohibitedWords: [],
		scrollLength: 500,
		logFeedWarnings: false
	},

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	//Define required styles.
	getStyles: function () {
		return ["newsfeed.css"];
	},

	// Define required translations.
	getTranslations: function () {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build your own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.newsItems = [];
		this.loaded = false;
		this.error = null;
		this.activeItem = 0;
		this.scrollPosition = 0;

		this.registerFeeds();

		this.isShowingDescription = this.config.showDescription;
	},

	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "NEWS_ITEMS") {
			this.generateFeed(payload);

			if (!this.loaded) {
				if (this.config.hideLoading) {
					this.show();
				}
				this.scheduleUpdateInterval();
			}

			this.loaded = true;
			this.error = null;
		} else if (notification === "INCORRECT_URL") {
			this.error = `Incorrect url: ${payload.url}`;
			this.scheduleUpdateInterval();
		}
	},

	//Override fetching of template name
	getTemplate: function () {
		if (this.config.feedUrl) {
			return "oldconfig.njk";
		} else if (this.config.showFullArticle) {
			return "fullarticle.njk";
		}
		return "newsfeed.njk";
	},

	//Override template data and return whats used for the current template
	getTemplateData: function () {
		// this.config.showFullArticle is a run-time configuration, triggered by optional notifications
		if (this.config.showFullArticle) {
			return {
				url: this.getActiveItemURL()
			};
		}
		if (this.error) {
			return {
				error: this.error
			};
		}
		if (this.newsItems.length === 0) {
			return {
				loaded: false
			};
		}
		if (this.activeItem >= this.newsItems.length) {
			this.activeItem = 0;
		}

		const item = this.newsItems[this.activeItem];

		return {
			loaded: true,
			config: this.config,
			sourceTitle: item.sourceTitle,
			publishDate: moment(new Date(item.pubdate)).fromNow(),
			title: item.title,
			description: item.description
		};
	},

	getActiveItemURL: function () {
		return typeof this.newsItems[this.activeItem].url === "string" ? this.newsItems[this.activeItem].url : this.newsItems[this.activeItem].url.href;
	},

	/**
	 * Registers the feeds to be used by the backend.
	 */
	registerFeeds: function () {
		for (let feed of this.config.feeds) {
			this.sendSocketNotification("ADD_FEED", {
				feed: feed,
				config: this.config
			});
		}
	},

	/**
	 * Generate an ordered list of items for this configured module.
	 *
	 * @param {object} feeds An object with feeds returned by the node helper.
	 */
	generateFeed: function (feeds) {
		let newsItems = [];
		for (let feed in feeds) {
			const feedItems = feeds[feed];
			if (this.subscribedToFeed(feed)) {
				for (let item of feedItems) {
					item.sourceTitle = this.titleForFeed(feed);
					if (!(this.config.ignoreOldItems && Date.now() - new Date(item.pubdate) > this.config.ignoreOlderThan)) {
						newsItems.push(item);
					}
				}
			}
		}
		newsItems.sort(function (a, b) {
			const dateA = new Date(a.pubdate);
			const dateB = new Date(b.pubdate);
			return dateB - dateA;
		});
		if (this.config.maxNewsItems > 0) {
			newsItems = newsItems.slice(0, this.config.maxNewsItems);
		}

		if (this.config.prohibitedWords.length > 0) {
			newsItems = newsItems.filter(function (value) {
				for (let word of this.config.prohibitedWords) {
					if (value["title"].toLowerCase().indexOf(word.toLowerCase()) > -1) {
						return false;
					}
				}
				return true;
			}, this);
		}

		newsItems.forEach((item) => {
			//Remove selected tags from the beginning of rss feed items (title or description)
			if (this.config.removeStartTags === "title" || this.config.removeStartTags === "both") {
				for (let startTag of this.config.startTags) {
					if (item.title.slice(0, startTag.length) === startTag) {
						item.title = item.title.slice(startTag.length, item.title.length);
					}
				}
			}

			if (this.config.removeStartTags === "description" || this.config.removeStartTags === "both") {
				if (this.isShowingDescription) {
					for (let startTag of this.config.startTags) {
						if (item.description.slice(0, startTag.length) === startTag) {
							item.description = item.description.slice(startTag.length, item.description.length);
						}
					}
				}
			}

			//Remove selected tags from the end of rss feed items (title or description)

			if (this.config.removeEndTags) {
				for (let endTag of this.config.endTags) {
					if (item.title.slice(-endTag.length) === endTag) {
						item.title = item.title.slice(0, -endTag.length);
					}
				}

				if (this.isShowingDescription) {
					for (let endTag of this.config.endTags) {
						if (item.description.slice(-endTag.length) === endTag) {
							item.description = item.description.slice(0, -endTag.length);
						}
					}
				}
			}
		});

		// get updated news items and broadcast them
		const updatedItems = [];
		newsItems.forEach((value) => {
			if (this.newsItems.findIndex((value1) => value1 === value) === -1) {
				// Add item to updated items list
				updatedItems.push(value);
			}
		});

		// check if updated items exist, if so and if we should broadcast these updates, then lets do so
		if (this.config.broadcastNewsUpdates && updatedItems.length > 0) {
			this.sendNotification("NEWS_FEED_UPDATE", { items: updatedItems });
		}

		this.newsItems = newsItems;
	},

	/**
	 * Check if this module is configured to show this feed.
	 *
	 * @param {string} feedUrl Url of the feed to check.
	 * @returns {boolean} True if it is subscribed, false otherwise
	 */
	subscribedToFeed: function (feedUrl) {
		for (let feed of this.config.feeds) {
			if (feed.url === feedUrl) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Returns title for the specific feed url.
	 *
	 * @param {string} feedUrl Url of the feed
	 * @returns {string} The title of the feed
	 */
	titleForFeed: function (feedUrl) {
		for (let feed of this.config.feeds) {
			if (feed.url === feedUrl) {
				return feed.title || "";
			}
		}
		return "";
	},

	/**
	 * Schedule visual update.
	 */
	scheduleUpdateInterval: function () {
		this.updateDom(this.config.animationSpeed);

		// Broadcast NewsFeed if needed
		if (this.config.broadcastNewsFeeds) {
			this.sendNotification("NEWS_FEED", { items: this.newsItems });
		}

		this.timer = setInterval(() => {
			this.activeItem++;
			this.updateDom(this.config.animationSpeed);

			// Broadcast NewsFeed if needed
			if (this.config.broadcastNewsFeeds) {
				this.sendNotification("NEWS_FEED", { items: this.newsItems });
			}
		}, this.config.updateInterval);
	},

	resetDescrOrFullArticleAndTimer: function () {
		this.isShowingDescription = this.config.showDescription;
		this.config.showFullArticle = false;
		this.scrollPosition = 0;
		// reset bottom bar alignment
		document.getElementsByClassName("region bottom bar")[0].classList.remove("newsfeed-fullarticle");
		if (!this.timer) {
			this.scheduleUpdateInterval();
		}
	},

	notificationReceived: function (notification, payload, sender) {
		const before = this.activeItem;
		if (notification === "MODULE_DOM_CREATED" && this.config.hideLoading) {
			this.hide();
		} else if (notification === "ARTICLE_NEXT") {
			this.activeItem++;
			if (this.activeItem >= this.newsItems.length) {
				this.activeItem = 0;
			}
			this.resetDescrOrFullArticleAndTimer();
			Log.debug(this.name + " - going from article #" + before + " to #" + this.activeItem + " (of " + this.newsItems.length + ")");
			this.updateDom(100);
		} else if (notification === "ARTICLE_PREVIOUS") {
			this.activeItem--;
			if (this.activeItem < 0) {
				this.activeItem = this.newsItems.length - 1;
			}
			this.resetDescrOrFullArticleAndTimer();
			Log.debug(this.name + " - going from article #" + before + " to #" + this.activeItem + " (of " + this.newsItems.length + ")");
			this.updateDom(100);
		}
		// if "more details" is received the first time: show article summary, on second time show full article
		else if (notification === "ARTICLE_MORE_DETAILS") {
			// full article is already showing, so scrolling down
			if (this.config.showFullArticle === true) {
				this.scrollPosition += this.config.scrollLength;
				window.scrollTo(0, this.scrollPosition);
				Log.debug(this.name + " - scrolling down");
				Log.debug(this.name + " - ARTICLE_MORE_DETAILS, scroll position: " + this.config.scrollLength);
			} else {
				this.showFullArticle();
			}
		} else if (notification === "ARTICLE_SCROLL_UP") {
			if (this.config.showFullArticle === true) {
				this.scrollPosition -= this.config.scrollLength;
				window.scrollTo(0, this.scrollPosition);
				Log.debug(this.name + " - scrolling up");
				Log.debug(this.name + " - ARTICLE_SCROLL_UP, scroll position: " + this.config.scrollLength);
			}
		} else if (notification === "ARTICLE_LESS_DETAILS") {
			this.resetDescrOrFullArticleAndTimer();
			Log.debug(this.name + " - showing only article titles again");
			this.updateDom(100);
		} else if (notification === "ARTICLE_TOGGLE_FULL") {
			if (this.config.showFullArticle) {
				this.activeItem++;
				this.resetDescrOrFullArticleAndTimer();
			} else {
				this.showFullArticle();
			}
		} else if (notification === "ARTICLE_INFO_REQUEST") {
			this.sendNotification("ARTICLE_INFO_RESPONSE", {
				title: this.newsItems[this.activeItem].title,
				source: this.newsItems[this.activeItem].sourceTitle,
				date: this.newsItems[this.activeItem].pubdate,
				desc: this.newsItems[this.activeItem].description,
				url: this.getActiveItemURL()
			});
		}
	},

	showFullArticle: function () {
		this.isShowingDescription = !this.isShowingDescription;
		this.config.showFullArticle = !this.isShowingDescription;
		// make bottom bar align to top to allow scrolling
		if (this.config.showFullArticle === true) {
			document.getElementsByClassName("region bottom bar")[0].classList.add("newsfeed-fullarticle");
		}
		clearInterval(this.timer);
		this.timer = null;
		Log.debug(this.name + " - showing " + this.isShowingDescription ? "article description" : "full article");
		this.updateDom(100);
	}
});
