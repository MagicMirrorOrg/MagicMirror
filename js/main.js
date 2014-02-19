jQuery.fn.updateWithText = function(text, speed)
{
	var dummy = $('<div/>').html(text);

	if ($(this).html() != dummy.html())
	{
		$(this).fadeOut(speed/2, function() {
			$(this).html(text);
			$(this).fadeIn(speed/2, function() {
				//done
			});		
		});
	}
} 

jQuery.fn.outerHTML = function(s) {
    return s
        ? this.before(s).remove()
        : jQuery("<p>").append(this.eq(0).clone()).html();
};

jQuery(document).ready(function($) {

	var news = [];
	var newsIndex = 0;
	
	(function updateTime()
	{
		var now = new Date();
		var hh = now.getHours();
		var mm = now.getMinutes();
		var ss = now.getSeconds();

		hh = (hh < 10) ? '0' + hh : hh;
		mm = (mm < 10) ? '0' + mm : mm;
		ss = (ss < 10) ? '0' + ss : ss;

		var time = hh + ":" + mm;

		$('.time').html(time);

		setTimeout(function() {
			updateTime();
		}, 1000);
	})();

	(function updateCompliment()
	{
		var compliments = ['Hey, handsome!','Hi, sexy!','Hello, beauty!', 'You look sexy!', 'Wow, you look hot!'];
		var i = Math.floor(Math.random()*compliments.length);
		$('.compliment').updateWithText(compliments[i], 4000);

		setTimeout(function() {
			updateCompliment();
		}, 20000);
	})();

	(function updateWeather()
	{
		var iconTable = {
			'01d':'wi-day-sunny',
			'02d':'wi-day-cloudy',
			'03d':'wi-cloudy',
			'04d':'wi-cloudy-windy',
			'09d':'wi-showers',
			'10d':'wi-rain',
			'11d':'wi-thunderstorm',
			'13d':'wi-snow',
			'50d':'wi-fog',
			'01n':'wi-night-clear',
			'02n':'wi-night-cloudy',
			'03n':'wi-night-cloudy',
			'04n':'wi-night-cloudy',
			'09n':'wi-night-showers',
			'10n':'wi-night-rain',
			'11n':'wi-night-thunderstorm',
			'13n':'wi-night-snow',
			'50n':'wi-night-alt-cloudy-windy'		
		}
		var params = {
			'q':'Baarn,Netherlands',
			'units':'metric',
			'lang':'nl'
		}

		$.getJSON('http://api.openweathermap.org/data/2.5/weather', params, function(json, textStatus) {
			var temp = Math.round(json.main.temp * 10) / 10;
			var iconClass = iconTable[json.weather[0].icon];
			var icon = $('<span/>').addClass('icon').addClass(iconClass);
			$('.temp').updateWithText(icon.outerHTML()+temp+'&deg;', 1000);
		});

		setTimeout(function() {
			updateWeather();
		}, 60000);
	})();


	(function fetchNews() {
		$.feedToJson({
			feed:'http://feeds.nos.nl/nosjournaal?format=rss',
			//feed:'http://www.nu.nl/feeds/rss/achterklap.rss',
			//feed:'http://www.nu.nl/feeds/rss/opmerkelijk.rss',
			success: function(data){
				news = [];
				for (var i in data.item) {
					var item = data.item[i];
					news.push(item.title);
				}
			}
		});
		setTimeout(function() {
			fetchNews();
		}, 60000);
	})();

	(function showNews() {
		var newsItem = news[newsIndex];
		$('.Bottom').updateWithText(newsItem,2000);

		newsIndex--;
		if (newsIndex < 0) newsIndex = news.length - 1;
		setTimeout(function() {
			showNews();
		}, 5000);
	})();
	
});