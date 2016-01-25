var time = {
	timeFormat: config.time.timeFormat || 24,
	dateLocation: '.date',
	timeLocation: '#time',
	updateInterval: 10000,
	intervalId: null
};

/**
 * Updates the time that is shown on the screen
 */
time.updateTime = function () {
	var timeLocation = this.timeLocation;
	var _now = moment();
	var _date = _now.format('[<span class="dayname">]dddd,[</span> <span class="longdate">]LL[</span>]');
	
	$(this.dateLocation).updateWithText(_date, 1000);
	$('.fade').removeClass('fade')
	var diff = $('<div>').html(_now.format(this._timeFormat+':mm').replace(/./g, "<span>$&</span>"));
	diff.children().each(function( index ) {
		var _text  = $( this ).text();
		var _i = index+1;
		var _text2 = $(timeLocation + ' span:nth-child('+_i+')').text();
		if (_text != _text2) {
			$(timeLocation +' span:nth-child('+_i+')').addClass('fade');
			$(this).addClass('fade');
		}
	});
	$('.fade').fadeTo(400, 0.25, function() {
		$(timeLocation).html(diff.html());
		$(timeLocation).children().fadeTo(400, 1).removeClass('fade');
	}).bind(this);

}

time.init = function () {

	if (parseInt(time.timeFormat) === 12) {
		time._timeFormat = 'hh'
	} else {
		time._timeFormat = 'HH';
	}
	$(this.timeLocation).html('<span class="fade"></span>');

	this.intervalId = setInterval(function () {
		this.updateTime();
	}.bind(this), 1000);

}