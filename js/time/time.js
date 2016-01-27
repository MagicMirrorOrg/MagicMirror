var time = {
	timeFormat: config.time.timeFormat || 24,
	dateLocation: '.date',
	timeLocation: '.time',
	updateInterval: 1000,
	intervalId: null
};

/**
 * Updates the time that is shown on the screen
 */
time.updateTime = function () {

	var _now = moment(),
		_date = _now.format('dddd, LL');

	$(this.dateLocation).html(_date);
	$(this.timeLocation).html(_now.format(this.timeFormat+':mm[<span class="sec">]ss[</span>]'));

};

time.init = function () {

	if (parseInt(time.timeFormat) === 12) {
		time.timeFormat = 'h'
	} else {
		time.timeFormat = 'H';
	}

	this.intervalId = setInterval(function () {
		this.updateTime();
	}.bind(this), 1000);

};