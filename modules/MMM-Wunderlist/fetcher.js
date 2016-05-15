/* Magic Mirror
 * Fetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl edited for Wunderlist by Paul-Vincent Roll
 * MIT Licensed.
 */

var request = require("request");

/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute listID string - ID of the Wunderlist list.
 * attribute reloadInterval number - Reload interval in milliseconds.
 */

var Fetcher = function(listID, reloadInterval, accessToken, clientID) {
 var self = this;
 if (reloadInterval < 1000) {
	reloadInterval = 1000;
 }

 var reloadTimer = null;
 var items = [];

 var fetchFailedCallback = function() {};
 var itemsReceivedCallback = function() {};

 /* private methods */

 /* fetchTodos()
	* Request the new items.
	*/

 var fetchTodos = function() {
	clearTimeout(reloadTimer);
	reloadTimer = null;

	request({
		url: "https://a.wunderlist.com/api/v1/tasks?list_id=" + listID,
		method: "GET",
		headers: {
		 "X-Access-Token": accessToken,
		 "X-Client-ID": clientID
		}
	 },
	 function(error, response, body) {
		if (!error && response.statusCode == 200) {
         items = [];
		 for (var i = 0; i < JSON.parse(body).length; i++) {
			items.push(JSON.parse(body)[i].title);
		 }
		 self.broadcastItems();
		 scheduleTimer();
		}
	 });

 };

 /* scheduleTimer()
	* Schedule the timer for the next update.
	*/

 var scheduleTimer = function() {
	//console.log('Schedule update timer.');
	clearTimeout(reloadTimer);
	reloadTimer = setTimeout(function() {
	 fetchTodos();
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
	* Initiate fetchTodos();
	*/
 this.startFetch = function() {
	fetchTodos();
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
	itemsReceivedCallback(self);
 };

 this.onReceive = function(callback) {
	itemsReceivedCallback = callback;
 };

 this.onError = function(callback) {
	fetchFailedCallback = callback;
 };

 this.id = function() {
	return listID;
 };

 this.items = function() {
	return items;
 };
};

module.exports = Fetcher;