var time = {
	timeFormat: config.time.timeFormat || 24,
	dateLocation: '.date',
	timeLocation: '#time',
	updateInterval: 1000,
	intervalId: undefined,
	displaySeconds: (typeof config.time.displaySeconds == 'undefined') ? true : config.time.displaySeconds,
	digitFade: (typeof config.time.digitFade == 'undefined') ? false : config.time.digitFade,
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
	var html = ''
	if (this.displaySeconds) {
		html = _now.format(this._timeFormat+':mm').replace(/./g, '<span class="digit">$&</span>') + 
			'<span class="sec">' + _now.format('ss').replace(/./g, '<span class="digit">$&</span>') + '</span>';
		if (typeof this.intervalId == 'undefined') {
			this.intervalId = setInterval(function () {
				this.updateTime();
			}.bind(this), this.updateInterval);
		}
	} else {
		html = _now.format(this._timeFormat+':mm').replace(/./g, '<span class="digit">$&</span>');
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
		seconds = 60 - (new Date()).getSeconds();
		setTimeout(function () {
			this.updateTime();
		}.bind(this), seconds*1000);
	}
	if (this.digitFade) {
		var diff = $('<div>').html(html);
		diff.find('.digit').each(function( index ) {
			var _text  = $( this ).text();
			var _i = index+1;
			var liveNode = $(timeLocation).find('.digit')[index] 
			if (typeof liveNode != 'undefined') {
				liveNode = $(liveNode);
				var _text2 = liveNode.text();
				if (_text != _text2) {
					
					liveNode.addClass('fade');
					$(this).addClass('fade');
				}
			} else {
				$(this).addClass('fade');
			}
		});
		if ($('.fade').length == 0) {
			// Initial Update
			$(this.timeLocation).html(diff.html());
			diff = undefined;
		} else {
			$('.fade').fadeTo(400, 0.25, function() {
				if (typeof diff != 'undefined') {
					$(this.timeLocation).html(diff.html());
					diff = undefined;
				}
				$('.fade').fadeTo(400, 1).removeClass('fade');
			}.bind(this));
		}
	} else {
		if (this.displaySeconds) {
			$(this.timeLocation).html(_now.format(this._timeFormat+':mm[<span class="sec">]ss[</span>]'));
		} else {
			$(this.timeLocation).html(_now.format(this._timeFormat+':mm'));
		}
	}
}

time.init = function () {

	if (parseInt(time.timeFormat) === 12) {
		time._timeFormat = 'hh'
	} else {
		time._timeFormat = 'HH';
	}
	this.updateTime();

}