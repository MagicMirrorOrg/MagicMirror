// MMM-Wallpaper.js

Module.register("MMM-Wallpaper", {
	// Default module config
	defaults: {
		source: "bing",
		updateInterval: 60 * 60 * 1000,
		slideInterval: 5 * 60 * 1000,
		maximumEntries: 10,
		filter: "grayscale(0.5) brightness(0.5)",
		orientation: "auto",
		caption: true,
		crossfade: true,
		maxWidth: Number.MAX_SAFE_INTEGER,
		maxHeight: Number.MAX_SAFE_INTEGER,
		nsfw: true,
		size: "cover",
		flickrHighRes: true,
		shuffle: true
	},

	getStyles: function () {
		return ["MMM-Wallpaper.css"];
	},

	start: function () {
		var self = this;

		self.nextImage = null;
		self.loadNextImageTimer = null;
		self.imageIndex = 0;
		self.imageClasses = {};

		self.wrapper = document.createElement("div");
		self.content = document.createElement("div");
		self.img = null;
		self.nextImg = null;
		self.title = document.createElement("div");
		self.fadeClass = self.config.crossfade ? "crossfade-image" : "";

		self.wrapper.className = "MMM-Wallpaper";
		self.wrapper.appendChild(self.content);
		self.content.appendChild(self.title);

		self.content.className = "content";
		self.title.className = "title";

		document.body.insertBefore(self.wrapper, document.body.firstChild);

		self.getData();
		setInterval(function () {
			self.getData();
		}, self.config.updateInterval);

		window.onresize = () => {
			self.imageClasses = {};
			if (self.img !== null) {
				self.img.onload();
			}
		};
	},

	notificationReceived: function (notification, payload, sender) {
		var self = this;

		if (notification === "LOAD_NEXT_WALLPAPER") {
			self.loadNextImage();
		}
	},

	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification === "WALLPAPERS") {
			if (payload.orientation === self.getOrientation() && ((Array.isArray(self.config.source) && self.config.source.includes(payload.source)) || (!Array.isArray(self.config.source) && self.config.source === payload.source))) {
				self.images = payload.images.slice(0, self.config.maximumEntries);
				self.imageIndex = self.imageIndex % (self.images.length || 1);

				if (self.nextImage === null && self.images.length > 0) {
					self.nextImage = self.images[self.imageIndex];
					self.loadNextImage();

					if (self.config.slideInterval > 0) {
						self.loadNextImageTimer = setTimeout(function () {
							self.loadNextImage();
						}, self.config.slideInterval);
					}
				}
			}
		}
	},

	getData: function () {
		var self = this;
		var config = Object.assign({}, self.config);

		config.orientation = self.getOrientation();
		self.sendSocketNotification("FETCH_WALLPAPERS", config);
	},

	getOrientation: function () {
		var self = this;

		if (self.config.orientation === "auto") {
			var viewport = self.getViewport();
			return viewport.width < viewport.height ? "vertical" : "horizontal";
		}

		return self.config.orientation;
	},

	onImageLoaded: function (img) {
		var self = this;

		return () => {
			if (!(img.src in self.imageClasses)) {
				self.imageClasses[img.src] = self.getWallpaperClasses(img);
			}

			img.className = `${self.fadeClass} ${self.imageClasses[img.src]}`;

			if (img.style.opacity !== "0") {
				return;
			}

			img.style.opacity = 1;
			self.title.style.display = "none";

			setTimeout(
				() => {
					var caption = self.nextImage.caption;
					if (self.config.caption && caption) {
						self.title.innerHTML = caption;
						self.title.style.display = "initial";
					}

					if (self.img !== null) {
						self.content.removeChild(self.img);
					}
					self.img = self.nextImg;
					self.nextImage = null;
					self.nextImg = null;
				},
				self.config.crossfade ? 1000 : 0
			);
		};
	},

	createImage: function (url) {
		var self = this;
		var img = document.createElement("img");

		img.style.filter = self.config.filter;
		img.style.opacity = 0;
		img.onload = self.onImageLoaded(img);
		img.src = url;

		return img;
	},

	getDom: function () {
		return document.createElement("span");
	},

	getViewport: function () {
		var w = window;
		var e = document.documentElement;
		var g = document.body;

		return {
			width: w.innerWidth || e.clientWidth || g.clientWidth,
			height: w.innerHeight || e.clientHeight || g.clientHeight
		};
	},

	getWallpaperClasses: function (image) {
		var self = this;
		var viewport = self.getViewport();
		var fitVerticalWidth = (image.naturalWidth * viewport.height) / image.naturalHeight;
		var sizePolicy = self.config.size === "contain" ? "contain" : "cover";

		if (fitVerticalWidth >= viewport.width) {
			return `wallpaper ${sizePolicy}-wide`;
		} else {
			return `wallpaper ${sizePolicy}-tall`;
		}
	},

	getImageUrl: function (image) {
		var viewport = this.getViewport();
		var url = image.url;

		if ("variants" in image) {
			for (var i in image.variants) {
				var variant = image.variants[i];

				if (variant.width > this.config.maxWidth || variant.height > this.config.maxHeight) {
					break;
				}

				url = variant.url;

				if (variant.width >= viewport.width && variant.height >= viewport.height) {
					break;
				}
			}
		}

		return url;
	},

	loadNextImage: function () {
		var self = this;

		if (self.nextImg !== null) {
			return;
		}

		self.imageIndex = (self.imageIndex + 1) % self.images.length;
		self.nextImage = self.images[self.imageIndex];

		if (self.nextImage !== null) {
			self.nextImg = self.createImage(self.getImageUrl(self.nextImage));
			self.content.insertBefore(self.nextImg, self.title);
		}

		if (self.config.slideInterval > 0) {
			clearTimeout(self.loadNextImageTimer);
			self.loadNextImageTimer = setTimeout(function () {
				self.loadNextImage();
			}, self.config.slideInterval);
		}
	}
});
