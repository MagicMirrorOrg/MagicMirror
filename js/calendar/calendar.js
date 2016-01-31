var calendar = {
	eventList: [],
	calendarLocation: '.calendar',
	updateInterval: 1000,
	updateDataInterval: 60000,
	fadeInterval: 1000,
	intervalId: null,
	dataIntervalId: null,
	maximumEntries: config.calendar.maximumEntries || 10,
	calendarUrl: (typeof config.calendar.urls == 'undefined') ? config.calendar.url : config.calendar.urls[0].url,
	calendarPos: 0,
	defaultSymbol: config.calendar.defaultSymbol || 'none',
	calendarSymbol: (typeof config.calendar.urls == 'undefined') ? config.calendar.defaultSymbol || 'none' : config.calendar.urls[0].symbol,
	displaySymbol: (typeof config.calendar.displaySymbol == 'undefined') ? false : config.calendar.displaySymbol,
	shortRunningText: 'still',
	longRunningText: 'until',
}

calendar.processEvents = function (url, events) {
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

calendar.updateData = function (callback) {
	new ical_parser("controllers/calendar.php" + "?url="+encodeURIComponent(this.calendarUrl), function(cal) {
		this.processEvents(this.calendarUrl, cal.getEvents());

		this.calendarPos++;
		if ((typeof config.calendar.urls == 'undefined') || (this.calendarPos >= config.calendar.urls.length)) {
			this.calendarPos = 0;
			// Last Calendar in List is updated, run Callback (i.e. updateScreen)
			if (callback !== undefined && Object.prototype.toString.call(callback) === '[object Function]') {
				callback(this.eventList);
			}
		} else {
			// Loading all Calendars in parallel does not work, load them one by one.
			setTimeout(function () {
				this.updateData(this.updateCalendar.bind(this));
			}.bind(this), 10);
		}
		if (typeof config.calendar.urls != 'undefined') {
			this.calendarUrl = config.calendar.urls[this.calendarPos].url;
			this.calendarSymbol = config.calendar.urls[this.calendarPos].symbol || this.defaultSymbol;
		}

	}.bind(this));

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

calendar.init = function () {

	this.updateData(this.updateCalendar.bind(this));

	// this.intervalId = setInterval(function () {
		// this.updateCalendar(this.eventList)
	// }.bind(this), this.updateInterval);

	this.dataIntervalId = setInterval(function () {
		this.updateData(this.updateCalendar.bind(this));
	}.bind(this), this.updateDataInterval);

}
