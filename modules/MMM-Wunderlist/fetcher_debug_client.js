"use strict";

/* Magic Mirror
 * Module: MMM-Wunderlist
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

var Fetcher = require("./fetcher.js");

function createFetcher(listID, list, reloadInterval, accessToken, clientID) {
 var self = this;

 var fetcher;
 if (typeof fetchers[listID] === "undefined") {
	console.log("Create new todo fetcher for list: " + list + " - Interval: " + reloadInterval);
	fetcher = new Fetcher(listID, reloadInterval, accessToken, clientID);

	fetcher.onReceive(function(fetcher) {
	 broadcastTodos();
	});

	fetcher.onError(function(fetcher, error) {
	 self.sendSocketNotification("FETCH_ERROR", {
		url: fetcher.url(),
		error: error
	 });
	});

	fetchers[listID] = {
	 "name": list,
	 "instance": fetcher
	};
 } else {
	console.log("Use exsisting todo fetcher for list: " + list);
	fetcher = fetchers[listID].instance;
	fetcher.setReloadInterval(reloadInterval);
	fetcher.broadcastItems();
 }

 fetcher.startFetch();
};

/* broadcastTodos()
 * Creates an object with all todo items of the different registered todo lists, 
 * and broadcasts these using sendSocketNotification.
 */
function broadcastTodos() {
 var feeds = {};
 for (var f in fetchers) {
	feeds[fetchers[f].name] = fetchers[f].instance.items();
 }
 console.log(feeds);
}


var fetchers = {};
createFetcher("id", "Inbox", 1000, accessToken, clientID);
createFetcher("id", "Inbox", 1000, accessToken, clientID);