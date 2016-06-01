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
		fadeSpeed: 3 * 1000,		// fade out and in for 3 seconds
		view: "monthly"
	},

	// Required styles
	getStyles: function() {
		return ["calendar2.css"];
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
			Log.log("Calendar2 updating at " + moment().format("hh:mm"));
		}, this.config.updateInterval);
	},
	
	// Override dom generator
	getDom: function() {

	// Labels for the days of the week
	calendar_days_labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

	// The current date
	cal_current_date = new Date();

	var month = moment().month();
	var year = moment().year();
	
	
	// Find first day of the month
	var firstDay = moment().date(1);
	var startingDay = firstDay.day();

	// Find number of days in month
	var monthLength = moment().daysInMonth();

	var wrapper = document.createElement("div");
	wrapper.className = 'xsmall';
	
	// Header
	var monthName = moment().format("MMM");
	var html = '<table id="calendar-table">';

	html += '<thead>';
	html += '<tr><th scope="col" colspan="7" id="calendar-th">';
	html += monthName + "&nbsp;" + year;
	html += '</th></tr>';
	html += '</thead>';
	
	html += '<tfoot>';
	html += '<tr><td>&nbsp;</td></tr>';
	html += '</tfoot>';
	
	html += '<tbody>';
	html += '<tr id="calendar-header">';
	for(var i = 0; i <= 6; i++ ){
		html += '<td id="calendar-header-day">';
		Log.log("From moment: " + moment().isoWeekday(0 + i).format("ddd"));
		html += moment().isoWeekday(0 + i).format("ddd");
		html += '</td>';
	}
	html += '</tr><tr>';

	// Fill in the days
	var day = 1;
	// Loop for amount of weeks (as rows)
	for (var i = 0; i < 9; i++) {
		// Loop for each weekday (as individual cells)
		for (var j = 0; j <= 6; j++) {
			if (day == moment().date()) {
				html += '<td class="calendar-day today">';
			} else {
				html += '<td class="calendar-day">';
			}
			if (day <= monthLength && (i > 0 || j >= startingDay)) {
				html += day;
				day++;
			}
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