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

	var _now = moment(),
		_date = _now.format('[<span class="dayname">]dddd,[</span><span class="longdate">]LL[</span>]');
	

	$(this.dateLocation).updateWithText(_date, 1000);
	$('.fade').removeClass('fade')
	$('#timebuffer').html(_now.format('HH:mm').replace(/./g, "<span>$&</span>"));
	$('#timebuffer').children().each(function( index ) {
		var _text  = $( this ).text();
		var _i = index+1;
		var _text2 = $('#time span:nth-child('+_i+')').text();
		if (_text != _text2) {
			$('#time span:nth-child('+_i+')').addClass('fade');
			$(this).addClass('fade');
		}
	});
	$('.fade').fadeTo(400, 0.25, function() {
		$('#time').html($('#timebuffer').html());
		$('#time').children().fadeTo(400, 1).removeClass('fade');
	});

}

time.init = function () {

	if (parseInt(time.timeFormat) === 12) {
		time._timeFormat = 'hh'
	} else {
		time._timeFormat = 'HH';
	}

	this.intervalId = setInterval(function () {
		this.updateTime();
	}.bind(this), 1000);

}