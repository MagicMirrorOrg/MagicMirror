// Labels for the days of the week
cal_days_labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Human-readable month name labels, in order
cal_months_labels = ['January', 'February', 'March', 'April',
                     'May', 'June', 'July', 'August', 'September',
                     'October', 'November', 'December'];

// Days of the week for each month, in order -- leap year is dynamically calculated later
cal_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// The current date
cal_current_date = new Date();

function Calendar(month, year) {
	this.month = (isNaN(month) || month == null) ? cal_current_date.getMonth() : month;
	this.year  = (isNaN(year) || year == null) ? cal_current_date.getFullYear() : year;
	this.html = '';
}

Calendar.prototype.generateHTML = function() {
	// Find first day of the month
	var firstDay = new Date(this.year, this.month, 1);
	var startingDay = firstDay.getDay();

	// Find number of days in month
	var monthLength = cal_days_in_month[this.month];

	// Compensate for leap year
	if (this.month == 1) { // this applies to February only!
		if ((this.year % 4 == 0 && this.year % 100 != 0) || this.year % 400 == 0) {
			monthLength = 29;
		}
	}

	// Header
	var monthName = cal_months_labels[this.month];
	var html = '<table class="calendar-table">';
	html += '<tr><th colspan="7">';
	html +=  monthName + "&nbsp;" + this.year;
	html += '</th></tr>';
	html += '<tr class="calendar-header">';
	for(var i = 0; i <= 6; i++ ){
		html += '<td class="calendar-header-day">';
		html += cal_days_labels[i];
		html += '</td>';
	}
	html += '</tr><tr>';

	// Fill in the days
	var day = 1;
	// Loop for amount of weeks (as rows)
	for (var i = 0; i < 9; i++) {
		// Loop for each weekday (as individual cells)
		for (var j = 0; j <= 6; j++) {
			if (day == cal_current_date.getDate()) {
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
		// DOn't need any more rows if we've run out of days
		if (day > monthLength) {
			break;
		} else {
			html += '</tr><tr>';
		}
	}
	html += '</tr></table>';

	this.html = html;
}

Calendar.prototype.getHTML = function() {
	return this.html;
}
