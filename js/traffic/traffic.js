var traffic = {
	trafficLocation: '.traffic',
	params: keys.traffic.params || null,
	setup: config.traffic,
	travelBuffer: 300,
	updateInterval: 300000,
	fadeInterval: 1000,
	intervalId: null
};

/**
 * Retrieves the current travel time from Google Maps Directions API
 */
traffic.updateCurrentTraffic = function () {

	var hour = moment().hour();
	var dayOfWeek = moment().day();
	var startTime = traffic.setup.startTimeHour + (traffic.setup.startTimeMinute/60);

	//Only displays traffic in the mornings of weekdays
	if(traffic.setup.active && traffic.setup.regular && (hour >= (startTime - traffic.setup.preTime) && hour <= startTime && dayOfWeek >= traffic.setup.weekStart && dayOfWeek <= traffic.setup.weekEnd)){

		$.ajax({
			type: 'GET',
			url: 'controllers/traffic.php?',
			dataType: 'json',
			data: traffic.params,
			success: function (data) {
	
				var _duration = data.routes[0].legs[0].duration.value,
					_durationInTraffic = data.routes[0].legs[0].duration_in_traffic.value,
					_trafficTime = _durationInTraffic - _duration,
					_trafficPhrase = traffic.getPhrase(_trafficTime);

				var now = new Date;								// now

				now.setHours(traffic.setup.startTimeHour);		// set hours to work start time
				now.setMinutes(traffic.setup.startTimeMinute);	// set minutes to work start time
				now.setSeconds(0);								// set seconds to 0

				var workTime = Math.floor(now / 1000);			// divide by 1000, truncate milliseconds
				
				var leaveByTimeSeconds = workTime - (_durationInTraffic + traffic.travelBuffer);
				var unix_time = moment().unix();
				
				if (leaveByTimeSeconds > (unix_time + traffic.travelBuffer)){
					
					var leaveByTime = new Date(leaveByTimeSeconds*1000);
					var hours = leaveByTime.getHours();

					if(hours>12){
						hours-=12;
					}

					var minutes = "0" + leaveByTime.getMinutes();
					var formattedTime = hours + ':' + minutes.substr(-2);

					$(this.trafficLocation).updateWithText('<p class="padding">' + _trafficPhrase + ', leave by ' + formattedTime, this.fadeInterval);
					
				} else {
					
					$(this.trafficLocation).updateWithText('<p class="padding">' + _trafficPhrase + ', leave now', this.fadeInterval);
				
				}
				
			}.bind(this),
			error: function () {
			}
		});
	
	} else if(traffic.setup.active && !(traffic.setup.regular)){
		
		$.ajax({
			type: 'GET',
			url: 'controllers/traffic.php?',
			dataType: 'json',
			data: traffic.params,
			success: function (data) {
	
				var _duration = data.routes[0].legs[0].duration.value,
					_durationInTraffic = data.routes[0].legs[0].duration_in_traffic.value,
					_durationInTrafficMinutes = data.routes[0].legs[0].duration_in_traffic.text,
					_trafficTime = _durationInTraffic - _duration,
					_trafficPhrase = traffic.getPhrase(_trafficTime);

				$(this.trafficLocation).updateWithText('<p class="padding">' + _trafficPhrase + ', current commute is ' + _durationInTrafficMinutes, this.fadeInterval);

			}.bind(this),
			error: function () {
			}
		});
		
	} else{

		$(this.trafficLocation).updateWithText('', this.fadeInterval);

	}
};

traffic.getPhrase = function(_trafficTime){

	var _trafficPhrase = 'No traffic';

	//Convert _trafficTime from seconds to minutes
	_trafficTime = _trafficTime / 60;

	//Verbal traffic conditions
	if(_trafficTime <= 2){
		_trafficPhrase = 'No traffic';
	} else if (_trafficTime > 2 && _trafficTime <= 5){
		_trafficPhrase = 'Light traffic';
	} else if (_trafficTime > 5 && _trafficTime <= 10){
		_trafficPhrase = 'Moderate traffic';
	} else if (_trafficTime > 10 && _trafficTime <= 15){
		_trafficPhrase = 'Heavy delays';
	} else {
		_trafficPhrase = 'Severe traffic';
	}

	return _trafficPhrase;
};

traffic.init = function () {

	this.updateCurrentTraffic();

	this.intervalId = setInterval(function () {
		this.updateCurrentTraffic();
	}.bind(this), this.updateInterval);

};
