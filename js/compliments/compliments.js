var compliments = {
	complimentLocation: '.compliment',
	currentCompliment: '',
	complimentList: {
		'morning': morning,
		'afternoon': afternoon,
		'evening': evening
	},
	updateInterval: 30000,
	fadeInterval: 4000,
	intervalId: null
};

compliments.updateCompliment = function () {

	var _list = [];

	var hour = moment().hour();

	if (hour >= 3 && hour < 12) {
		// Morning compliments
		_list = compliments.complimentList['morning'];
	} else if (hour >= 12 && hour < 17) {
		// Afternoon compliments
		_list = compliments.complimentList['afternoon'];
	} else if (hour >= 17 || hour < 3) {
		// Evening compliments
		_list = compliments.complimentList['evening'];
	} else {
		// Edge case in case something weird happens
		// This will select a compliment from all times of day
		Object.keys(compliments.complimentList).forEach(function (_curr) {

			_list = _list.concat(compliments.complimentList[_curr]);

		});
	}

	// Search for the location of the current compliment in the list
	var _spliceIndex = _list.indexOf(compliments.currentCompliment);

	// If it exists, remove it so we don't see it again
	if (_spliceIndex !== -1) {
		_list = _list.slice(_spliceIndex, 1);
	}

	// Randomly select a location
	var _location = Math.floor(Math.random() * _list.length);
	compliments.currentCompliment = _list[_location];

	$('.compliment').updateWithText(compliments.currentCompliment, compliments.fadeInterval);

}

compliments.init = function () {

	this.updateCompliment();

	this.intervalId = setInterval(function () {
		this.updateCompliment();
	}.bind(this), this.updateInterval)

}