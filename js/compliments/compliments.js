var compliments = {
	complimentLocation: '.compliment',
	currentCompliment: '',
	complimentList: {
		'birthday': config.compliments.birthday,
		'christmas': config.compliments.christmas,
		'morning': config.compliments.morning,
		'afternoon': config.compliments.afternoon,
		'evening': config.compliments.evening
	},
	updateInterval: config.compliments.interval || 30000,
	fadeInterval: config.compliments.fadeInterval || 4000,
	intervalId: null
};

/**
 * Changes the compliment visible on the screen
 */
compliments.updateCompliment = function () {



	var _list = [];

	var hour = moment().hour();
	var dateDay = moment().date();
	var dateMonth = moment().month();

	// In the following if statement we use .slice() on the
	// compliments array to make a copy by value. 
	// This way the original array of compliments stays in tact.

	if (dateDay == 27 && dateMonth == 4) {
		// Birthday compliments
		_list = compliments.complimentList['birthday'].slice();
	} else if (dateDay == 25 && dateMonth == 11) {
		// Christmas compliments
		_list = compliments.complimentList['christmas'].slice();
	} else if (hour >= 3 && hour < 12) {
		// Morning compliments
		_list = compliments.complimentList['morning'].slice();
	} else if (hour >= 12 && hour < 17) {
		// Afternoon compliments
		_list = compliments.complimentList['afternoon'].slice();
	} else if (hour >= 17 || hour < 3) {
		// Evening compliments
		_list = compliments.complimentList['evening'].slice();
	} else {
		// Edge case in case something weird happens
		// Just reuse evening
		_list = compliments.complimentList['evening'].slice();
	}

	// Search for the location of the current compliment in the list
	var _spliceIndex = _list.indexOf(compliments.currentCompliment);

	// If it exists, remove it so we don't see it again
	if (_spliceIndex !== -1) {
		_list.splice(_spliceIndex, 1);
	}

	// Randomly select a location
	var _randomIndex = Math.floor(Math.random() * _list.length);
	compliments.currentCompliment = _list[_randomIndex];

	$('.compliment').updateWithText(compliments.currentCompliment, compliments.fadeInterval);

}

compliments.init = function () {

	this.updateCompliment();

	this.intervalId = setInterval(function () {
		this.updateCompliment();
	}.bind(this), this.updateInterval)

}