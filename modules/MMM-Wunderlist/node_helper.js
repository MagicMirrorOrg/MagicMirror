"use strict";

/* Magic Mirror
 * Module: MMM-Wunderlist
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
var request = require("request");
const Fetcher = require("./fetcher.js");

module.exports = NodeHelper.create({
 start: function() {
	this.config = [];
	this.fetchers = {};
	this.started = false;
 },

 getLists: function(callback) {
	request({
	 url: "https://a.wunderlist.com/api/v1/lists",
	 method: "GET",
	 headers: {
		"X-Access-Token": this.config.accessToken,
		"X-Client-ID": this.config.clientID
	 }
	}, function(error, response, body) {
	 if (!error && response.statusCode == 200) {
		var lists = {};
		for (var i = 0; i < JSON.parse(body).length; i++) {
		 lists[JSON.parse(body)[i].title] = {
			id: JSON.parse(body)[i].id
		 };
		}
		callback(lists);
	 }
	});
 },

 createFetcher: function(listID, list, reloadInterval) {
	var self = this;

	var fetcher;
	if (typeof this.fetchers[listID] === "undefined") {
	 console.log("Create new todo fetcher for list: " + list + " - Interval: " + reloadInterval);
	 fetcher = new Fetcher(listID, reloadInterval, this.config.accessToken, this.config.clientID);

	 fetcher.onReceive(function(fetcher) {
		self.broadcastTodos();
	 });

	 fetcher.onError(function(fetcher, error) {
		self.sendSocketNotification("FETCH_ERROR", {
		 url: fetcher.id(),
		 error: error
		});
	 });

	 this.fetchers[listID] = {
		"name": list,
		"instance": fetcher
	 };
	} else {
	 console.log("Use exsisting todo fetcher for list: " + list);
	 fetcher = this.fetchers[listID].instance;
	 fetcher.setReloadInterval(reloadInterval);
	 fetcher.broadcastItems();
	}

	fetcher.startFetch();
 },

 broadcastTodos: function() {
	var todos = {};
	for (var f in this.fetchers) {
	 todos[this.fetchers[f].name] = this.fetchers[f].instance.items();
	}
	this.sendSocketNotification("TASKS", todos);
 },

 // Subclass socketNotificationReceived received.
 socketNotificationReceived: function(notification, payload) {
	if (notification === "CONFIG" && this.started == false) {
	 const self = this
	 this.config.interval = payload.interval
	 this.config.accessToken = payload.accessToken;
	 this.config.clientID = payload.clientID;
	 this.getLists(function(data) {
		self.lists = data
		self.sendSocketNotification("STARTED")
	 });
	 self.started = true
	} else if (notification === "addLists") {
	 for (var i in payload) {
		this.createFetcher(this.lists[payload[i]].id, payload[i], this.config.interval * 1000);
	 }
	} else if (notification === "CONNECTED") {
	 this.broadcastTodos()
	}
 }

});