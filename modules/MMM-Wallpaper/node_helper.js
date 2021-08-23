"use strict";

const NodeHelper = require("node_helper");
const request = require("request");
const fs = require("fs");
const express = require("express");
const crypto = require("crypto");
const http = require("http");
const https = require("https");

function shuffle(a) {
	var source = a.slice(0);
	var result = [];
	var i, j;

	for (i = a.length; i > 0; --i) {
		j = Math.floor(Math.random() * i);
		result.push(source[j]);
		source[j] = source[i - 1];
	}

	return result;
}

function parseBool(val) {
	var num = +val;
	return !!(val && isNaN(num) ? String(val).toLowerCase().replace(!1, "") : num);
}

function pick(a) {
	if (Array.isArray(a)) {
		return a[Math.floor(Math.random() * a.length)];
	} else {
		return a;
	}
}

module.exports = NodeHelper.create({
	start: function () {
		var self = this;

		console.log(`Starting node helper for: ${self.name}`);
		self.cache = {};
		self.handlers = {};
		self.firetv = JSON.parse(fs.readFileSync(`${__dirname}/firetv.json`));
		self.chromecast = JSON.parse(fs.readFileSync(`${__dirname}/chromecast.json`));
	},

	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification === "FETCH_WALLPAPERS") {
			self.fetchWallpapers(payload);
		}
	},

	fetchWallpapers: function (config) {
		var self = this;
		var result = self.getCacheEntry(config);
		var url;
		var method = "GET";
		var body = undefined;

		if (config.maximumEntries <= result.images.length && Date.now() < result.expires) {
			self.sendResult(config);
			return;
		}

		config.source = pick(config.source);
		var source = config.source.toLowerCase();
		if (source === "firetv") {
			self.cacheResult(config, shuffle(self.firetv.images));
		} else if (source === "chromecast") {
			self.cacheResult(config, shuffle(self.chromecast));
		} else if (source.startsWith("local:")) {
			self.readdir(config);
		} else if (source.startsWith("http://") || source.startsWith("https://")) {
			self.cacheResult(config, [{ url: config.source }]);
		} else if (source.startsWith("/r/")) {
			self.request(config, {
				url: `https://www.reddit.com${config.source}/hot.json`,
				headers: {
					"user-agent": "MagicMirror:MMM-Wallpaper:v1.0 (by /u/kolbyhack)"
				}
			});
		} else if (source.startsWith("/user/")) {
			self.request(config, {
				url: `https://www.reddit.com${config.source}.json`,
				headers: {
					"user-agent": "MagicMirror:MMM-Wallpaper:v1.0 (by /u/kolbyhack)"
				}
			});
		} else if (source === "pexels") {
			self.request(config, {
				url: `https://api.pexels.com/v1/search?query=${config.pexels_search}`,
				headers: {
					Authorization: config.pexels_key
				}
			});
		} else if (source.startsWith("icloud:")) {
			self.iCloudState = "webstream";
			self.request(config, {
				method: "POST",
				url: `https://p04-sharedstreams.icloud.com/${config.source.substring(7).trim()}/sharedstreams/webstream`,
				body: '{"streamCtag":null}'
			});
		} else if (source.startsWith("flickr-group:")) {
			self.request(config, {
				url: `https://api.flickr.com/services/feeds/groups_pool.gne?format=json&id=${config.source.substring(13).trim()}`
			});
		} else if (source.startsWith("flickr-user:")) {
			self.request(config, {
				url: `https://api.flickr.com/services/feeds/photos_public.gne?format=json&id=${config.source.substring(12).trim()}`
			});
		} else if (source.startsWith("flickr-user-faves:")) {
			self.request(config, {
				url: `https://api.flickr.com/services/feeds/photos_faves.gne?format=json&id=${config.source.substring(18).trim()}`
			});
		} else if (source.startsWith("lightroom:")) {
			self.request(config, {
				url: `https://${config.source.substring(10).trim()}`
			});
		} else if (source.startsWith("synology-moments:")) {
			self.synologyMomentsState = "create_session";
			self.request(config, {
				url: config.source.substring(17).trim()
			});
		} else if (source.startsWith("metmuseum:")) {
			var args = config.source.substring(10).split(",");
			self.request(config, {
				url: `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&departmentId=${args[0]}&isHighlight=${args[1]}&q=${args[2]}`
			});
		} else {
			self.request(config, {
				url: `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=${config.maximumEntries}`
			});
		}
	},

	readdir: function (config) {
		var self = this;
		var result = self.getCacheEntry(config);
		const path = config.source.substring(6).trim();
		const urlPath = `/${self.name}/images/${result.key}/`;

		if (!(result.key in self.handlers)) {
			var handler = express.static(path);

			self.handlers[result.key] = handler;
			self.expressApp.use(urlPath, handler);
		}

		async function processDir() {
			const dir = await fs.promises.readdir(path);
			var images = [];

			for (const dirent of dir) {
				if (dirent.toLowerCase().match(/\.(?:a?png|avif|gif|p?jpe?g|jfif|pjp|svg|webp|bmp)$/) !== null) {
					images.push({
						url: `${urlPath}${dirent}`
					});
				}
			}

			if (config.shuffle) {
				images = shuffle(images);
			}

			self.cacheResult(config, images);
		}

		processDir();
	},

	request: function (config, params) {
		var self = this;

		if (!("headers" in params)) {
			params.headers = {};
		}

		if (!("cache-control" in params.headers)) {
			params.headers["cache-control"] = "no-cache";
		}

		request(params, function (error, response, body) {
			if (error) {
				self.sendSocketNotification("FETCH_ERROR", { error: error });
				return console.error(` ERROR - MMM-Wallpaper: ${error}`);
			}

			if (response.statusCode < 400 && body.length > 0) {
				self.processResponse(response, body, config);
			}
		});
	},

	cacheResult: function (config, images) {
		var self = this;
		var cache = self.getCacheEntry(config);

		cache.expires = Date.now() + config.updateInterval * 0.9;
		cache.images = images;

		self.sendResult(config);
	},

	sendResult: function (config) {
		var self = this;
		var result = self.getCacheEntry(config);

		self.sendSocketNotification("WALLPAPERS", {
			source: config.source,
			orientation: config.orientation,
			images: result.images.slice(0, config.maximumEntries)
		});
	},

	processResponse: function (response, body, config) {
		var self = this;
		var images;

		var source = config.source.toLowerCase();
		if (source.startsWith("/r/") || source.startsWith("/user/")) {
			images = self.processRedditData(config, JSON.parse(body));
		} else if (source.startsWith("icloud:")) {
			images = self.processiCloudData(response, JSON.parse(body), config);
		} else if (source.startsWith("flickr-")) {
			images = self.processFlickrData(config, body);
		} else if (source === "pexels") {
			images = self.processPexelsData(config, JSON.parse(body));
		} else if (source.startsWith("lightroom:")) {
			images = self.processLightroomData(config, body);
		} else if (source.startsWith("synology-moments:")) {
			images = self.processSynologyMomentsData(response, body, config);
		} else if (source.startsWith("metmuseum:")) {
			images = self.processMetMuseumData(config, JSON.parse(body));
		} else {
			images = self.processBingData(config, JSON.parse(body));
		}

		if (images.length === 0) {
			return;
		}

		self.cacheResult(config, images);
	},

	processPexelsData: function (config, data) {
		var self = this;
		var orientation = config.orientation === "vertical" ? "portrait" : "landscape";

		var images = [];
		for (var image of data.photos) {
			images.push({
				url: image.src[orientation],
				caption: `Photographer: ${image.photographer}`
			});
		}

		return images;
	},

	processBingData: function (config, data) {
		var self = this;
		var width = config.orientation === "vertical" ? 1080 : 1920;
		var height = config.orientation === "vertical" ? 1920 : 1080;
		var suffix = `_${width}x${height}.jpg`;

		var images = [];
		for (var image of data.images) {
			images.push({
				url: `https://www.bing.com${image.urlbase}${suffix}`,
				caption: image.copyright
			});
		}

		return images;
	},

	processRedditData: function (config, data) {
		var self = this;

		var images = [];
		for (var post of data.data.children) {
			if (post.kind === "t3" && !post.data.pinned && !post.data.stickied && post.data.post_hint === "image" && (config.nsfw || !post.data.over_18)) {
				var variants = post.data.preview.images[0].resolutions.slice(0);

				variants.push(post.data.preview.images[0].source);
				variants.map((v) => {
					v.url = v.url.split("&amp;").join("&");
					return v;
				});
				variants.sort((a, b) => {
					return a.width * a.height - b.width * b.height;
				});

				images.push({
					url: post.data.url.replace("&amp;", "&"),
					caption: post.data.title,
					variants: variants
				});

				if (images.length === config.maximumEntries) {
					break;
				}
			}
		}

		return images;
	},

	processiCloudData: function (response, body, config) {
		var self = this;
		var album = config.source.substring(7).trim();
		var images = [];

		if (self.iCloudState === "webstream") {
			if (response.statusCode === 330) {
				self.iCloudHost = body["X-Apple-MMe-Host"];
				self.request(config, {
					method: "POST",
					url: `https://${self.iCloudHost}/${album}/sharedstreams/webstream`,
					body: '{"streamCtag":null}'
				});
			} else if (response.statusCode === 200) {
				if (config.shuffle) {
					body.photos = shuffle(body.photos);
				}
				self.iCloudPhotos = body.photos.filter((p) => p != null && p.derivatives.mediaAssetType !== "video").slice(0, config.maximumEntries);
				self.iCloudState = "webasseturls";

				var photoGuids = self.iCloudPhotos.map((p) => {
					return p.photoGuid;
				});
				self.request(config, {
					method: "POST",
					url: `https://${self.iCloudHost}/${album}/sharedstreams/webasseturls`,
					body: JSON.stringify({ photoGuids: photoGuids })
				});
			}
		} else if (self.iCloudState === "webasseturls") {
			for (var checksum in body.items) {
				var p = body.items[checksum];
				var loc = body.locations[p.url_location];
				var host = loc.hosts[Math.floor(Math.random() * loc.hosts.length)];

				for (var photo of self.iCloudPhotos) {
					for (var d in photo.derivatives) {
						var m = photo.derivatives[d];
						if (m.checksum === checksum) {
							m.url = `${loc.scheme}://${host}${p.url_path}`;
							break;
						}
					}
				}
			}

			images = self.iCloudPhotos.map((p) => {
				var result = {
					url: null,
					caption: p.caption,
					variants: []
				};

				for (var i in p.derivatives) {
					var d = p.derivatives[i];

					if (+d.width > 0) {
						result.variants.push({
							url: d.url,
							width: +d.width,
							height: +d.height
						});
					}
				}

				result.variants.sort((a, b) => {
					return a.width * a.height - b.width * b.height;
				});
				result.url = result.variants[result.variants.length - 1].url;

				return result;
			});
		}

		return images;
	},

	processFlickrData: function (config, body) {
		var self = this;
		var data = JSON.parse(body.replace(/^[^{]*/, "").replace(/[^}]*$/, ""));

		var images = [];
		for (var post of data.items) {
			var url = post.media.m;

			if (parseBool(config.flickrHighRes)) {
				url = url.replace(/_m\./, "_h.");
			}

			images.push({
				url: url,
				caption: post.title
			});

			if (images.length === config.maximumEntries) {
				break;
			}
		}

		return images;
	},

	processLightroomData: function (config, body) {
		var self = this;
		var data = body.match(/data-srcset="[^"]+/g);

		if (config.shuffle) {
			data = shuffle(data);
		}

		var images = [];
		for (var srcset of data) {
			var variants = srcset.substring(13).split(",");
			var result = {
				url: null,
				variants: []
			};

			for (var v of variants) {
				var d = v.split(" ");
				var width = Number.parseInt(d[1]);

				if (width > 0) {
					result.variants.push({
						url: d[0],
						width: width,
						height: 1
					});
				}
			}

			if (result.variants.length === 0) {
				continue;
			}

			result.variants.sort((a, b) => {
				return a.width * a.height - b.width * b.height;
			});
			result.url = result.variants[result.variants.length - 1].url;
			images.push(result);

			if (images.length === config.maximumEntries) {
				break;
			}
		}

		return images;
	},

	processSynologyMomentsData: function (response, body, config) {
		var self = this;
		var url = new URL(config.source.substring(17).trim());
		var last_slash = url.pathname.lastIndexOf("/");
		var api_path = `${url.pathname.substring(0, last_slash)}/webapi/entry.cgi`;
		var api_url = `${url.protocol}//${url.host}${api_path}`;
		var album = url.pathname.substring(last_slash + 1);
		var images = [];
		var cache_entry = self.getCacheEntry(config);

		if (!("image_map" in cache_entry)) {
			cache_entry.image_map = {};
			cache_entry.session_cookie = null;
		}

		if (!(cache_entry.key in self.handlers)) {
			// https://stackoverflow.com/a/10435819
			var handler = (oreq, ores, next) => {
				const options = {
					host: url.host,
					port: url.port,
					protocol: url.protocol,
					path: cache_entry.image_map[oreq.url],
					method: "GET",
					headers: {
						"cache-control": "none",
						cookie: cache_entry.session_cookie
					}
				};

				const module = url.protocol === "http:" ? http : https;
				const preq = module
					.request(options, (pres) => {
						ores.writeHead(pres.statusCode, pres.headers);
						pres.on("data", (chunk) => {
							ores.write(chunk);
						});
						pres.on("close", () => {
							ores.end();
						});
						pres.on("end", () => {
							ores.end();
						});
					})
					.on("error", (e) => {
						try {
							ores.writeHead(500);
							ores.write(e.message);
						} catch (e) {}
						ores.end();
					});

				preq.end();
			};

			self.handlers[cache_entry.key] = handler;
			self.expressApp.use(`/${self.name}/images/${cache_entry.key}/`, handler);
		}

		if (response.statusCode !== 200) {
			console.error(`ERROR: ${response.statusCode} -- ${body}`);
		} else if (self.synologyMomentsState === "create_session") {
			if ("set-cookie" in response.headers) {
				cache_entry.session_cookie = response.headers["set-cookie"][0].split(";")[0];
				self.synologyMomentsState = "browse_item";
				self.request(config, {
					method: "POST",
					url: api_url,
					body: `additional=["thumbnail","resolution","orientation","video_convert","video_meta"]&offset=0&limit=${config.maximumEntries}&passphrase="${album}"&api="SYNO.Photo.Browse.Item"&method="list"&version=3`,
					headers: {
						cookie: cache_entry.session_cookie,
						"x-syno-sharing": album
					}
				});
			}
		} else {
			body = JSON.parse(body);
			images = body.data.list.map((i) => {
				cache_entry.image_map[`/${i.id}`] = `${api_path}?id=${i.id}&cache_key=${i.additional.thumbnail.cache_key}&type="unit"&size="xl"&api="SYNO.Photo.Thumbnail"&method="get"&version=1&_sharing_id="${album}"&passphrase="${album}"`;
				return {
					url: `/${self.name}/images/${cache_entry.key}/${i.id}`
				};
			});
		}

		return images;
	},

	processMetMuseumData: function (config, data) {
		var self = this;
		var images = [];

		if (data.objectIDs === null) {
			return [];
		}

		if (config.shuffle) {
			data.objectIDs = shuffle(data.objectIDs);
		}

		var objectIDs = data.objectIDs.slice(0, Math.min(60, config.maximumEntries));
		var pendingRequests = objectIDs.length;

		for (var id of objectIDs) {
			var url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;

			request(url, function (error, response, body) {
				var obj = JSON.parse(body);

				if (obj.isPublicDomain) {
					images.push({
						url: obj.primaryImageSmall,
						caption: `${obj.title} - ${obj.artistDisplayName}`
					});
				}

				if (--pendingRequests === 0) {
					self.cacheResult(config, images);
				}
			});
		}

		return [];
	},

	getCacheEntry: function (config) {
		var self = this;
		var key = crypto.createHash("sha1").update(`${config.source}::${config.orientation}`).digest("hex");

		if (!(key in self.cache)) {
			self.cache[key] = {
				key: key,
				expires: Date.now(),
				images: []
			};
		}

		return self.cache[key];
	}
});
