var traffic = {
	trafficLocation: '.traffic',
	params: keys.traffic.params || null,
	apiBase: 'https://maps.googleapis.com/maps/api/directions/',
	apiType: 'json',
	updateInterval: 300000,
	fadeInterval: 1000,
	intervalId: null
}

/**
 * Retrieves the current travel time from Google Maps Directions API
 */
traffic.updateCurrentTraffic = function () {

	var hour = moment().hour();
	var dayOfWeek = moment().day();
	var url = traffic.apiBase + traffic.apiType;
	
	//Only displays traffic in the mornings of weekdays
	if(hour >= 0 && hour <= 23 && dayOfWeek >= 0 && dayOfWeek <= 6){	

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
					_trafficPhrase = 'No traffic';
	
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
				
				$(this.trafficLocation).updateWithText(_trafficPhrase + ', current commute is ' + _durationInTrafficMinutes, this.fadeInterval);				

			}.bind(this),
			error: function () {
			}
		});
	
	} else{
		$(this.trafficLocation).updateWithText('', this.fadeInterval);
	}
}

traffic.init = function () {

	this.updateCurrentTraffic();

	this.intervalId = setInterval(function () {
		this.updateCurrentTraffic();
	}.bind(this), this.updateInterval);

}
