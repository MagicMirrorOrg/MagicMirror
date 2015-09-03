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

$.urlParam = function(name, url) {
    if (!url) {
     url = window.location.href;
    }
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
    if (!results) { 
        return undefined;
    }
    return results[1] || undefined;
}


jQuery.fn.outerHTML = function(s) {
    return s
        ? this.before(s).remove()
        : jQuery("<p>").append(this.eq(0).clone()).html();
};

function roundVal(temp)
{
	return Math.round(temp * 10) / 10;
}

function kmh2beaufort(kmh)
{
	var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
	for (var beaufort in speeds) {
		var speed = speeds[beaufort];
		if (speed > kmh) {
			return beaufort;
		}
	}
	return 12;
}

jQuery(document).ready(function($) {

	var news = [];
	var newshead = [];
	var newsIndex = 0;
	var eventList = [];
	var lastCompliment;
	var compliment;
	var lang;
	var lang_override = $.urlParam('lang');
	if (lang_override=='de') {lang='de';}
	else if (lang_override=='nl') {lang='nl';}
	else if (lang_override=='fr') {lang='fr';}
	else if (lang_override=='es') {lang='es';}
	else if (lang_override=='en') {lang='en';}
	else {lang = window.navigator.language;}
    switch (lang)
    {
        case 'de':
            var days 		= ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
            var months 		= ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
            var dayAbbr 	= ['So','Mo','Di','Mi','Do','Fr','Sa'];
            var today 		= 'heute';
            var tomorrow 	= 'morgen';
            var in_days 	= 'Tage';
            var datelabel 	= 'Tag';
            var morning 	= ['Guten Morgen, Schönling','Genieße den Tag','Gut geschlafen?'];
            var afternoon 	= ['Wow, sexy!','Du siehst gut aus!','Heute ist dein Tag!'];
            var evening 	= ['Wie war dein Tag?','Schöner Anblick!','Du bist sexy!'];
			var feed		= 'http://www.faz.net/rss/aktuell/';
			moment.locale('de');
            break;
        case 'nl':
            var days 		= ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
            var months 		= ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
            var dayAbbr 	= ['zo','ma','di','wo','do','vr','za'];
            var today 		= 'vandaag';
            var tomorrow 	= 'morgen';
            var in_days 	= 'dagen'
            var datelabel 	= 'Dag';
            var morning 	= ['Good morning, handsome!','Enjoy your day!','How was your sleep?'];
            var afternoon 	= ['Hello beauty!','You look sexy!','Looking good today!'];
            var evening 	= ['Wow, You look hot!','You look nice!','Hi, sexy!'];
			var feed		= 'http://feeds.nos.nl/nosjournaal?format=rss';
			moment.locale('nl');
            break;
       case 'fr':
            var days 		= ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
            var months 		= ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
            var dayAbbr 	= ['dim','lun','mar','mer','jeu','ven','sam'];
            var today 		= 'aujourd\'hui';
            var tomorrow 	= 'demain';
            var in_days 	= 'jour(s)';
            var datelabel 	= 'Jour';
            var morning 	= ['Good morning, handsome!','Enjoy your day!','How was your sleep?'];
            var afternoon 	= ['Hello beauty!','You look sexy!','Looking good today!'];
            var evening 	= ['Wow, You look hot!','You look nice!','Hi, sexy!'];
			var feed		= 'http://lesclesdedemain.lemonde.fr/screens/RSS/sw_getFeed.php?idTheme=HOME';
			moment.locale('fr');
            break;     
		case 'es':
            var days 		= ['domingo','lunes','martes','miécoles','jueves','viernes','sábado'];
            var months 		= ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','dicembre'];
            var dayAbbr 	= ['dim','lun','mar','mer','jeu','ven','sam'];
            var today 		= 'aujourd\'hui';
            var tomorrow 	= 'demain';
            var in_days 	= 'jour(s)';
            var datelabel 	= 'Jour';
            var morning 	= ['Good morning, handsome!','Enjoy your day!','How was your sleep?'];
            var afternoon 	= ['Hello beauty!','You look sexy!','Looking good today!'];
            var evening 	= ['Wow, You look hot!','You look nice!','Hi, sexy!'];
			var feed		= 'http://lesclesdedemain.lemonde.fr/screens/RSS/sw_getFeed.php?idTheme=HOME';
			moment.locale('es');
            break;     			
        default:
            var days 		= ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            var months 		= ['January','February','March','April','May','June','July','August','September','October','November','December'];
            var dayAbbr 	= ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            var today 		= 'Today';
            var tomorrow 	= 'Tomorrow';
            var in_days 	= 'days';
            var datelabel 	= 'Day';
            var morning 	= ['Good morning, handsome!','Enjoy your day!','How was your sleep?'];
            var afternoon 	= ['Hello beauty!','You look sexy!','Looking good today!'];
            var evening 	= ['Wow, You look hot!','You look nice!','Hi, sexy!'];
			var feed		= 'http://rss.cnn.com/rss/edition.rss';
			moment.locale('en');
    }

	//connect do Xbee monitor
	var socket = io.connect('http://rpi-development.local:8080');
	socket.on('dishwasher', function (dishwasherReady) {
		if (dishwasherReady) {
			$('.dishwasher').fadeIn(2000);
			$('.lower-third').fadeOut(2000);
		} else {
			$('.dishwasher').fadeOut(2000);
			$('.lower-third').fadeIn(2000);		
		}
	});


	var weatherParams = {
		'q':'Duesseldorf,Germany',
		'units':'metric',
		'lang':lang
	};
	
	(function checkVersion()
	{
		$.getJSON('githash.php', {}, function(json, textStatus) {
			if (json) {
				if (json.gitHash != gitHash) {
					window.location.reload();
					window.location.href=window.location.href;
				}
			}
		});
		setTimeout(function() {
			checkVersion();
		}, 3000);
	})();

	(function updateTime()
	{
		var now = new Date();
		var day = now.getDay();
		var date = now.getDate();
		var month = now.getMonth();
		var year = now.getFullYear();

		var date = days[day] + ', ' + date+' ' + months[month] + ' ' + year;


		$('.date').html(date);
		$('.time').html(now.toTimeString().substring(0,5) + '<span class="sec">'+now.toTimeString().substring(6,8)+'</span>');

		setTimeout(function() {
			updateTime();
		}, 1000);
	})();
	
	(function updateCalendarData()
	{
		new ical_parser("calendar.php", function(cal){
        	events = cal.getEvents();
        	eventList = [];

        	for (var i in events) {
        		var e = events[i];
        		for (var key in e) {
        			var value = e[key];
					var seperator = key.search(';');
					if (seperator >= 0) {
						var mainKey = key.substring(0,seperator);
						var subKey = key.substring(seperator+1);

						var dt;
						if (subKey == 'VALUE=DATE') {
							//date
							dt = new Date(value.substring(0,4), value.substring(4,6) - 1, value.substring(6,8));
						} else {
							//time
							dt = new Date(value.substring(0,4), value.substring(4,6) - 1, value.substring(6,8), value.substring(9,11), value.substring(11,13), value.substring(13,15));
						}

						if (mainKey == 'DTSTART') e.startDate = dt;
						if (mainKey == 'DTEND') e.endDate = dt;
					}
        		}

                if (e.startDate == undefined){
                    //some old events in Gmail Calendar is "start_date"
                    //FIXME: problems with Gmail's TimeZone
            		var days = moment(e.DTSTART).diff(moment(), 'days');
            		var seconds = moment(e.DTSTART).diff(moment(), 'seconds');
                    var startDate = moment(e.DTSTART);
                } else {
            		var days = moment(e.startDate).diff(moment(), 'days');
            		var seconds = moment(e.startDate).diff(moment(), 'seconds');
                    var startDate = moment(e.startDate);
                }

        		//only add fututre events, days doesn't work, we need to check seconds
        		if (seconds >= 0) {
                    if (seconds <= 60*60*5 || seconds >= 60*60*24*2) {
                        var time_string = moment(startDate).fromNow();
                    }else {
                        var time_string = moment(startDate).calendar()
                    }
                    if (!e.RRULE) {
    	        		eventList.push({'description':e.SUMMARY,'seconds':seconds,'days':time_string});
                    }
                    e.seconds = seconds;
        		}
                
                // Special handling for rrule events
                if (e.RRULE) {
                    var options = new RRule.parseString(e.RRULE);
                    options.dtstart = e.startDate;
                    var rule = new RRule(options);
                    
                    // TODO: don't use fixed end date here, use something like now() + 1 year
                    var dates = rule.between(new Date(), new Date(2016,12,31), true, function (date, i){return i < 10});
                    for (date in dates) {
                        var dt = new Date(dates[date]);
                        var days = moment(dt).diff(moment(), 'days');
                        var seconds = moment(dt).diff(moment(), 'seconds');
                        var startDate = moment(dt);
                     	if (seconds >= 0) {
                            if (seconds <= 60*60*5 || seconds >= 60*60*24*2) {
                                var time_string = moment(dt).fromNow();
                            } else {
                                var time_string = moment(dt).calendar()
                            }
                            eventList.push({'description':e.SUMMARY,'seconds':seconds,'days':time_string});
                        }           
                    }
                }
            };
        	eventList.sort(function(a,b){return a.seconds-b.seconds});

        	setTimeout(function() {
        		updateCalendarData();
        	}, 60000);
    	});
	})();

	(function updateCalendar()
	{
		table = $('<table/>').addClass('xsmall').addClass('calendar-table');
		opacity = 1;


		for (var i in eventList) {
			var e = eventList[i];

			var row = $('<tr/>').css('opacity',opacity);
			row.append($('<td/>').html(e.description).addClass('description'));
			row.append($('<td/>').html(e.days).addClass('days dimmed'));
			table.append(row);

			opacity -= 1 / eventList.length;
		}

		$('.calendar').updateWithText(table,1000);

		setTimeout(function() {
        	updateCalendar();
        }, 1000);
	})();

	(function updateCompliment()
	{
	  while (compliment == lastCompliment) {
      //Check for current time  
      var compliments;
      var date = new Date();
      var hour = date.getHours();
      //set compliments to use
      if (hour >= 3 && hour < 12) compliments = morning;
      if (hour >= 12 && hour < 17) compliments = afternoon;
      if (hour >= 17 || hour < 3) compliments = evening;

		compliment = Math.floor(Math.random()*compliments.length);
		}

		$('.compliment').updateWithText(compliments[compliment], 4000);

		lastCompliment = compliment;

		setTimeout(function() {
			updateCompliment(true);
		}, 30000);

	})();

	(function updateCurrentWeather()
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
		

		$.getJSON('http://api.openweathermap.org/data/2.5/weather', weatherParams, function(json, textStatus) {

			var temp = roundVal(json.main.temp);
			var temp_min = roundVal(json.main.temp_min);
			var temp_max = roundVal(json.main.temp_max);

			var wind = roundVal(json.wind.speed);

			var iconClass = iconTable[json.weather[0].icon];
			var icon = $('<span/>').addClass('icon').addClass('dimmed').addClass('wi').addClass(iconClass);
			$('.temp').updateWithText(icon.outerHTML()+temp+'&deg;', 1000);

			// var forecast = 'Min: '+temp_min+'&deg;, Max: '+temp_max+'&deg;';
			// $('.forecast').updateWithText(forecast, 1000);

			var now = new Date();
			var sunrise = new Date(json.sys.sunrise*1000).toTimeString().substring(0,5);
			var sunset = new Date(json.sys.sunset*1000).toTimeString().substring(0,5);

			var windString = '<span class="wi wi-strong-wind xdimmed"></span> ' + kmh2beaufort(wind) ;
			var sunString = '<span class="wi wi-sunrise xdimmed"></span> ' + sunrise;
			if (json.sys.sunrise*1000 < now && json.sys.sunset*1000 > now) {
				sunString = '<span class="wi wi-sunset xdimmed"></span> ' + sunset;
			}

			$('.windsun').updateWithText(windString+' '+sunString, 1000);
		});

		setTimeout(function() {
			updateCurrentWeather();
		}, 60000);
	})();

	(function updateWeatherForecast()
	{
			$.getJSON('http://api.openweathermap.org/data/2.5/forecast', weatherParams, function(json, textStatus) {

			var forecastData = {};

			for (var i in json.list) {
				var forecast = json.list[i];
				var dateKey  = forecast.dt_txt.substring(0, 10);

				if (forecastData[dateKey] == undefined) {
					forecastData[dateKey] = {
						'timestamp':forecast.dt * 1000,
						'temp_min':forecast.main.temp,
						'temp_max':forecast.main.temp
					};
				} else {
					forecastData[dateKey]['temp_min'] = (forecast.main.temp < forecastData[dateKey]['temp_min']) ? forecast.main.temp : forecastData[dateKey]['temp_min'];
					forecastData[dateKey]['temp_max'] = (forecast.main.temp > forecastData[dateKey]['temp_max']) ? forecast.main.temp : forecastData[dateKey]['temp_max']; 
				}

			}


			var forecastTable = $('<table />').addClass('forecast-table');
			var opacity = 1;
			var rowhead = $('<tr />').css('opacity', opacity);
			
			rowhead.append($('<td/>').addClass('day').html(datelabel));
			rowhead.append($('<td/>').addClass('temp-min').html('Min.'));
			rowhead.append($('<td/>').addClass('temp-max').html('Max.'));
			forecastTable.append(rowhead);
			for (var i in forecastData) {
				var forecast = forecastData[i];
				var dt = new Date(forecast.timestamp);
				var row = $('<tr />').css('opacity', opacity);

				row.append($('<td/>').addClass('day').html(dayAbbr[dt.getDay()]));
				row.append($('<td/>').addClass('temp-min').html(roundVal(forecast.temp_min).toFixed(1))); //convert into specified number of decimals
				row.append($('<td/>').addClass('temp-max').html(roundVal(forecast.temp_max).toFixed(1))); //Thanks to thk from KNX Userforum
			
				forecastTable.append(row);
				opacity -= 0.155;
			}


			$('.forecast').updateWithText(forecastTable, 1000);
		});

		setTimeout(function() {
			updateWeatherForecast();
		}, 60000);
	})();

	(function fetchNews() {
		$.feedToJson({
			feed: feed,
			success: function(data){
				newshead = [];
				news 	 = [];
				for (var i in data.item) {
					var item = data.item[i];
					
					var pos = item.description.search("<p>")
					var desc = item.description.substring(pos, item.description.length);
					var endpos = desc.search("</p>")
					var desc = desc.substring(0, endpos);
					news.push(desc);
					
					newshead.push(item.title);
					
				}
			}
		});
		setTimeout(function() {
			fetchNews();
		}, 60000);
	})();

	(function showNews() {
		var newsHead = newshead[newsIndex];
		var newsItem = news[newsIndex];
		
		$('.newshead').updateWithText(newsHead,2000);
		$('.news').updateWithText(newsItem,2000);

		newsIndex--;
		if (newsIndex < 0) newsIndex = news.length - 1;
			setTimeout(function() {
				showNews();
			}, 15000);	
		
		

	})();

	(function updateOpenHAB()
        {
                var temp = "";
                $.getJSON('http://127.0.0.1:8080/rest/items/MagicMirrorTXT/?type=json', {}, function(json, textStatus) {
                        if (json) {
                                temp = json.state;
                        }
                        $('.openhab').updateWithText(temp,2000);
                        if (temp != "") {
                                $('.openhab').fadeIn(2000);
                                $('.lower-third').fadeOut(2000);
                        } else {
                                $('.openhab').fadeOut(2000);
                                $('.lower-third').fadeIn(2000);
                        }
                });
                setTimeout(function() {
                        updateOpenHAB();
                }, 5000);
        })();
	
});
