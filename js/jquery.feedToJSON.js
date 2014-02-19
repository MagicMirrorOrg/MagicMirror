//jQuery extension to fetch an rss feed and return it as json via YQL
//created by dboz@airshp.com
(function($) {
  
	$.extend({
		feedToJson: function(options, callback) {
			if ($.isFunction(options)) {
			  callback = options;
			  options = null;
			}
			options = $.extend($.feedToJson.defaults,options);
			var url = options.yqlURL + options.yqlQS + "'" + encodeURIComponent(options.feed) + "'" + "&_nocache=" + options.cacheBuster;
			return $.getJSON(url, function(data){  
					//console.log(data.query.results);
					data = data.query.results;
					$.isFunction(callback) && callback(data); //allows the callback function to be the only option
					$.isFunction(options.success) && options.success(data);
				}); 
		}
	});
  
  //defaults
  $.feedToJson.defaults = {
  	yqlURL : 'http://query.yahooapis.com/v1/public/yql',  //yql 
  	yqlQS : '?format=json&callback=?&q=select%20*%20from%20rss%20where%20url%3D',  //yql query string
  	feed:'http://instagr.am/tags/tacos/feed/recent.rss', //instagram recent posts tagged 'tacos'
  	cachebuster: Math.floor((new Date().getTime()) / 1200 / 1000), //yql caches feeds, so we change the feed url every 20min
  	success:null //success callback 
  }; 
  
})(jQuery);
// eo feedToJson


