/* Magic Mirror
 * Module: Calendar2
 *
 * By Ashley M. Kirchner <kirash4@gmail.com>
 * Beer Licensed (meaning, if you like this module, feel free to have a beer on me, or send me one.)
 */

 Module.register("calendar2", {

	// Module defaults
	defaults: {
		updateInterval: 60 * 1000,	// every minute
		fadeSpeed: 2 * 1000,		// fade out and in for 3 seconds
		displayHeader: true,
		view: "monthly",
		cssStyle: "default"
	},

	// Required styles
	getStyles: function() {
		switch(this.config.cssStyle) {
			case "blue":
				return ["styleDefault.css", "styleBlue.css"];
				break;
			case "block":
				return ["styleDefault.css", "styleBlock.css"];
				break;
			case "custom":
				return ["styleDefault.css", "styleCustom.css"];
				break;
			default:
				return ["styleDefault.css"];
		}
	},
	
	// Required scripts
	getScripts: function() {
		return ["moment.js"];
	},
	
	// Override start method
	start: function() {
		Log.log("Starting module: " + this.name);
		
		// Set locale
		moment.locale(config.language);
		
		// Set scheduler
		var self = this;
		setInterval(function() {
			self.updateDom(self.config.fadeSpeed);
			//Log.log("Calendar2 updating at " + moment().format("hh:mm"));
		}, this.config.updateInterval);
	},
	
	// Override dom generator
	getDom: function() {

		var month = moment().month();
		var year = moment().year();
	
		// Find first day of the month
		var firstDay = moment().date(1);
		var startingDay = firstDay.day();
		Log.log("firstDay: " + firstDay);
		Log.log("startingDay: " + startingDay);

		// Find number of days in month
		var monthLength = moment().daysInMonth();

		var wrapper = document.createElement("div");
		wrapper.className = 'xsmall';
	
		// Header
		var monthName = moment().format("MMMM");
		var html = '<table id="calendar-table">';

		html += '<thead>';
		if (this.config.displayHeader) {
			html += '<tr><th scope="col" colspan="7" id="calendar-th">';
			html += '<span id="monthName">' + monthName + '</span>&nbsp;<span id="yearDigits">' + year + '</span>';
			html += '</th></tr>';
		}
		html += '</thead>';
	
		html += '<tfoot>';
		html += '<tr><td>&nbsp;</td></tr>';
		html += '</tfoot>';
	
		html += '<tbody>';
		html += '<tr id="calendar-header">';
		for(var i = 0; i <= 6; i++ ){
			html += '<td id="calendar-header-day">';
			html += moment().isoWeekday(0 + i).format("ddd");
			html += '</td>';
		}
		html += '</tr><tr>';

		// Fill in the days
		var day = 1;
		var nextMonth = 1;
		// Loop for amount of weeks (as rows)
		for (var i = 0; i < 9; i++) {
			// Loop for each weekday (as individual cells)
			for (var j = 0; j <= 6; j++) {
				html += '<td class="calendar-day">';
				html += '<div class="square-box">';
				html += '<div class="square-content"><div>';
				
				if (j < startingDay && i == 0) {
					// First row, fill in empty slots
					html+= '<span class="monthPrevNext">';
					html+= moment().subtract(1, 'months').endOf('month').subtract((startingDay - 1) - j, 'days').date();
				} else if (day <= monthLength && (i > 0 || j >= startingDay)) {
					if (day == moment().date()) {
						html += '<span id="today">';
					} else {
						html += '<span>';
					}
					html += day;
					html += '</span>';
					day++;
				} else if (day > monthLength && i > 0) {
					// Last row, fill in empty space
					html += '<span class="monthPrevNext">';
					html += moment([year, month, monthLength]).add(nextMonth, 'days').date();
					nextMonth++;
				}
				
				html += '</div></div></div>';
				html += '</td>';
			}
			// Don't need any more rows if we've run out of days
			if (day > monthLength) {
				break;
			} else {
				html += '</tr><tr>';
			}
		}	
		html += '</tr>';
		html += '</tbody>'
		html += '</table>';

		wrapper.innerHTML = html;
		
		return wrapper;
	},
	
 });