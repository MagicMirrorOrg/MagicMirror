var calendar = {
	eventList: [],
	calendarLocation: '.calendar',
	updateInterval: 1000,
	updateDataInterval: 60000,
	fadeInterval: 1000,
	intervalId: null,
	dataIntervalId: null,
	maximumEntries: config.calendar.maximumEntries || 10,
    useGapi: (typeof config.calendar.urls == 'undefined') ? false : config.calendar.urls[0].googleOauthApi,
    calendarUrl: (typeof config.calendar.urls == 'undefined') ? config.calendar.url : config.calendar.urls[0].url,
	calendarPos: 0,
	defaultSymbol: config.calendar.defaultSymbol || 'none',
	calendarSymbol: (typeof config.calendar.urls == 'undefined') ? config.calendar.defaultSymbol || 'none' : config.calendar.urls[0].symbol,
	displaySymbol: (typeof config.calendar.displaySymbol == 'undefined') ? false : config.calendar.displaySymbol,
	shortRunningText: 'still',
	longRunningText: 'until',
}

calendar.processEvents = function (url, events) {
	//remove this calendar's events before re-adding them
    tmpEventList = [];
	var eventListLength = this.eventList.length;
	for (var i = 0; i < eventListLength; i++) {
		if (this.eventList[i]['url'] != url) {
			tmpEventList.push(this.eventList[i]);
		}
	}
	this.eventList = tmpEventList;

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
			var endDays = moment(e.DTEND).diff(moment(), 'days');
			var endSeconds = moment(e.DTEND).diff(moment(), 'seconds');
			var endDate = moment(e.DTEND);
		} else {
			var days = moment(e.startDate).diff(moment(), 'days');
			var seconds = moment(e.startDate).diff(moment(), 'seconds');
			var startDate = moment(e.startDate);
			var endDays = moment(e.endDate).diff(moment(), 'days');
			var endSeconds = moment(e.endDate).diff(moment(), 'seconds');
			var endDate = moment(e.endDate);
		}

		//only add fututre events, days doesn't work, we need to check seconds
		if (seconds >= 0) {
			if (seconds <= 60*60*5 || seconds >= 60*60*24*2) {
				var time_string = moment(startDate).fromNow();
			}else {
				var time_string = moment(startDate).calendar()
			}
			if (!e.RRULE) {
				this.eventList.push({'description':e.SUMMARY,'seconds':seconds,'days':time_string,'url': url, symbol: this.calendarSymbol});
			}
			e.seconds = seconds;
		} else if  (endSeconds > 0) {
			// TODO: Replace with better lang handling
			if (endSeconds <= 60*60*5 || endSeconds >= 60*60*24*2) {
				var time_string = this.shortRunningText + ' ' + moment(endDate).fromNow(true);
			}else {
				var time_string = this.longRunningText + ' ' + moment(endDate).calendar()
			}
			if (!e.RRULE) {
				this.eventList.push({'description':e.SUMMARY,'seconds':seconds,'days':time_string,'url': url, symbol: this.calendarSymbol});
			}
			e.seconds = endSeconds;
		}
		// Special handling for rrule events
		if (e.RRULE) {
			var options = new RRule.parseString(e.RRULE);
			options.dtstart = e.startDate;
			var rule = new RRule(options);

			var oneYear = new Date();
			oneYear.setFullYear(oneYear.getFullYear() + 1);

			var dates = rule.between(new Date(), oneYear, true, function (date, i){return i < 10});
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
					this.eventList.push({'description':e.SUMMARY,'seconds':seconds,'days':time_string,'url': url, symbol: this.calendarSymbol});
				}
			}
		}
	};

	this.eventList = this.eventList.sort(function(a,b){return a.seconds-b.seconds});

	// Limit the number of entries.
	this.eventList = this.eventList.slice(0, calendar.maximumEntries);
}

calendar.processGapiEvents = function( url, resp){
    var events = resp.items;

	//remove this calendar's events before re-adding them
    tmpEventList = [];
	var eventListLength = this.eventList.length;
	for (var i = 0; i < eventListLength; i++) {
		if (this.eventList[i]['url'] != url) {
			tmpEventList.push(this.eventList[i]);
		}
	}
	this.eventList = tmpEventList;

	for (var i in events)
    {
        var e = events[i];
        //all day events use date insted of dateTime,
        //dateTime is preferred try to use it first then fall back to date
		if (typeof e.start.dateTime != 'undefined')
        {
            var days = moment(e.start.dateTime).diff(moment(), 'days');
			var seconds = moment(e.start.dateTime).diff(moment(), 'seconds');
			var startDate = moment(e.start.dateTime);
			var endDays = moment(e.end.dateTime).diff(moment(), 'days');
			var endSeconds = moment(e.end.dateTime).diff(moment(), 'seconds');
			var endDate = moment(e.end.dateTime);
        }
        else
        {
            var days = moment(e.start.date).diff(moment(), 'days');
			var seconds = moment(e.start.date).diff(moment(), 'seconds');
			var startDate = moment(e.start.date);
			var endDays = moment(e.end.date).diff(moment(), 'days');
			var endSeconds = moment(e.end.date).diff(moment(), 'seconds');
			var endDate = moment(e.end.date);
        }

		//get the text string for the event start/end display
		if (seconds >= 0) {
			if (seconds <= 60*60*5 || seconds >= 60*60*24*6) {
				var time_string = moment(startDate).fromNow();
			}else {
				var time_string = moment(startDate).calendar()
            }
			e.seconds = seconds;
		} else if  (endSeconds > 0) {
			// TODO: Replace with better lang handling
			if (endSeconds <= 60*60*5 || endSeconds >= 60*60*24*6) {
				var time_string = this.shortRunningText + ' ' + moment(endDate).fromNow(true);
			}else {
				var time_string = this.longRunningText + ' ' + moment(endDate).calendar()
            }
			e.seconds = endSeconds;
        }
        this.eventList.push({'description':e.summary,'seconds':seconds,'days':time_string,'url': url, symbol: this.calendarSymbol});
    }

	this.eventList = this.eventList.sort(function(a,b){return a.seconds-b.seconds});

	// Limit the number of entries.
	this.eventList = this.eventList.slice(0, calendar.maximumEntries);
}

calendar.updateData = function () {

    if(this.useGapi == false)
    {
        new ical_parser("controllers/calendar.php" + "?url="+encodeURIComponent(this.calendarUrl), calendar.updateDataCallback.bind(this));
    }
    else{
        //google cal
        console.log("gcal found");
        //loadCalendarApi();
        //listUpcomingEvents(this.calendarUrl, calendar.updateDataCallback.bind(this));
        this.listUpcomingEvents();
    }


}

calendar.updateDataCallback = function(cal) {
    if( this.useGapi == false)
    {
		this.processEvents(this.calendarUrl, cal.getEvents());
    }
    else {
        this.processGapiEvents(this.calendarUrl, cal);
    }
		this.calendarPos++;
		if ((typeof config.calendar.urls == 'undefined') || (this.calendarPos >= config.calendar.urls.length)) {
			this.calendarPos = 0;
            // Last Calendar in List is updated, run Callback (i.e. updateScreen)
            this.updateCalendar(this.eventList);
		} else {
			// Loading all Calendars in parallel does not work, load them one by one.
			setTimeout(function () {
				this.updateData();
			}.bind(this), 10);
		}
		if (typeof config.calendar.urls != 'undefined') {
			this.calendarUrl = config.calendar.urls[this.calendarPos].url;
			this.calendarSymbol = config.calendar.urls[this.calendarPos].symbol || this.defaultSymbol;
            this.useGapi = config.calendar.urls[this.calendarPos].googleOauthApi;
		}

}

calendar.updateCalendar = function (eventList) {
	var _is_new = true;
	if ($('.calendar-table').length) {
		_is_new = false;
	}
	table = $('<table/>').addClass('xsmall').addClass('calendar-table');
	opacity = 1;

	for (var i in eventList) {
		var e = eventList[i];
		var row = $('<tr/>').attr('id', 'event'+i).css('opacity',opacity).addClass('event');
		if (this.displaySymbol) {
			row.append($('<td/>').addClass('fa').addClass('fa-'+e.symbol).addClass('calendar-icon'));
		}
		row.append($('<td/>').html(e.description).addClass('description'));
		row.append($('<td/>').html(e.days).addClass('days dimmed'));
		if (! _is_new && $('#event'+i).length) {
			$('#event'+i).updateWithText(row.children(), this.fadeInterval);
		} else {
			// Something wrong - replace whole table
			_is_new = true;
		}
		table.append(row);

		opacity -= 1 / eventList.length;
	}
	if (_is_new) {
		$(this.calendarLocation).updateWithText(table, this.fadeInterval);
	}

}

// the scope for the auth.  we are going to request read only.
var SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

/**
 * Check if current user has authorized this application.
 */
checkAuth = function () {
    if(typeof config.calendar.googleCalendarApiId != 'undefined')
    {
        gapi.auth.authorize(
                {
                    'client_id': config.calendar.googleCalendarApiId,
                    'scope': SCOPES.join(' '),
                    'immediate': true
                }, calendar.handleAuthResult);
    }
    else { calendar.init(); }
}

/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
calendar.handleAuthResult = function(authResult) {
    var authorizeDiv = document.getElementById('authorize-div');
    console.log("auth callback");
    if (authResult && !authResult.error) {
        // Hide auth UI, then load client library.
        authorizeDiv.style.display = 'none';
        console.log("loading gcal api");
        calendar.loadCalendarApi();
    } else {
        // Show auth UI, allowing the user to initiate authorization by
        // clicking authorize button.
        console.log("gcal not authed");
        authorizeDiv.style.display = 'inline';
    }
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
calendar.handleAuthClick = function(event) {
    gapi.auth.authorize(
            {client_id: config.calendar.googleCalendarApiId, scope: SCOPES, immediate: false},
            calendar.handleAuthResult);
    return false;
}

/**
 * Load Google Calendar client library. List upcoming events
 * once client library is loaded.
 */
calendar.loadCalendarApi = function () {
    console.log("loaded g api");
    window.gapi.client.load('calendar', 'v3', calendar.init.bind(this));
}

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
calendar.listUpcomingEvents = function () {
    var request = window.gapi.client.calendar.events.list({
            'calendarId': this.calendarUrl,
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': calendar.maximumEntries,
            'orderBy': 'startTime'
            });

    request.execute(this.updateDataCallback.bind(this));
}

calendar.init = function () {

    this.updateData();

	// this.intervalId = setInterval(function () {
		// this.updateCalendar(this.eventList)
	// }.bind(this), this.updateInterval);

	this.dataIntervalId = setInterval(function () {
		this.updateData();
	}.bind(this), this.updateDataInterval);

}
