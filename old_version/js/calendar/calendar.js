var calendar = {
	eventList: [],
	calendarLocation: '.calendar',
	updateInterval: 1000,
	updateDataInterval: 60000,
	fadeInterval: 1000,
	intervalId: null,
	dataIntervalId: null,
	maximumEntries: config.calendar.maximumEntries || 10
}

calendar.updateData = function (callback) {

	new ical_parser("controllers/calendar.php" + "?url="+encodeURIComponent(config.calendar.url), function(cal) {
		var events = cal.getEvents();
		this.eventList = [];

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
					this.eventList.push({'description':e.SUMMARY,'seconds':seconds,'days':time_string});
				}
				e.seconds = seconds;
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
						this.eventList.push({'description':e.SUMMARY,'seconds':seconds,'days':time_string});
					}
				}
			}
		};

		this.eventList = this.eventList.sort(function(a,b){return a.seconds-b.seconds});

		// Limit the number of entries.
		this.eventList = this.eventList.slice(0, calendar.maximumEntries);

		if (callback !== undefined && Object.prototype.toString.call(callback) === '[object Function]') {
			callback(this.eventList);
		}

	}.bind(this));

}

calendar.updateCalendar = function (eventList) {

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

	$(this.calendarLocation).updateWithText(table, this.fadeInterval);

}

calendar.init = function () {

	this.updateData(this.updateCalendar.bind(this));

	this.intervalId = setInterval(function () {
		this.updateCalendar(this.eventList)
	}.bind(this), this.updateInterval);

	this.dataIntervalId = setInterval(function () {
		this.updateData(this.updateCalendar.bind(this));
	}.bind(this), this.updateDataInterval);

}
