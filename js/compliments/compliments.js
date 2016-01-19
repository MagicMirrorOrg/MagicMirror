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
	intervalId: null,
	birthdayList: keys.birthdays
};

/**
 * Changes the compliment visible on the screen
 */
compliments.updateCompliment = function () {

	var _list = [];

	var hour = moment().hour();
	var dateDay = moment().date();
	var dateMonth = moment().month() + 1;	//moment().month() returns 0-11, we need to change that to 1-12
	var birthdayToday = false;
	var count = this.birthdayList.length;
	
	// In the following if statement we use .slice() on the
	// compliments array to make a copy by value. 
	// This way the original array of compliments stays in tact.

	for (var i = 0; i < count; i++) {
		if(dateDay == this.birthdayList[i].day && dateMonth == this.birthdayList[i].month){
			birthdayToday = true;
			var birthdayName = this.birthdayList[i].name;
		};
	}

	if (birthdayToday) {
		// Birthday compliments
		_list = compliments.complimentList['birthday'].slice();
	} else if (dateDay == 25 && dateMonth == 12) {
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
	
	if(birthdayToday){
		compliments.currentCompliment = _list[_randomIndex] + birthdayName + '!';
	} else{
		compliments.currentCompliment = _list[_randomIndex];
	}	
	
	$(this.complimentLocation).updateWithText(compliments.currentCompliment, compliments.fadeInterval);

}

compliments.init = function () {

	this.updateCompliment();

	this.intervalId = setInterval(function () {
		this.updateCompliment();
	}.bind(this), this.updateInterval)

}